const express = require('express');
const multer = require('multer');
const path = require('path');
const { AcademicExcelProcessor } = require('../utils/excelSafeProcessor');
const ROLES = require('../config/roles');
const { audit } = require('../middleware/audit');
const logger = require('../utils/logger');
const cacheService = require('../services/cacheService');
let protect, authorize;
try {
  const authMiddleware = require('../middleware/auth');
  protect = authMiddleware.protect;
  authorize = authMiddleware.authorize;
} catch {
  protect = (req, res, next) => next();
  authorize = () => (req, res, next) => next();
}
let rateLimiter;
try {
  rateLimiter = async (req, res, next) => {
    try {
      const role = req.user?.role || 'unknown';
      const limits = { [ROLES.ADMIN]: 100, [ROLES.UNIVERSITY]: 50, [ROLES.TEACHER]: 50, [ROLES.UPLOADER]: 50 };
      const max = limits[role] || 30;
      const bucket = Math.floor(Date.now() / (15 * 60 * 1000));
      const userId = req.user?.id || req.user?._id || 'anon';
      const key = `excel_rate:${userId}:${req.ip}:${bucket}`;
      const count = await cacheService.increment(key, 1);
      try { await cacheService.set(`excel_rate_expire:${userId}:${bucket}`, '1', 15 * 60); } catch {}
      if (count && count > max) {
        return res.status(429).json({ success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.' }, data: { role, limit: max } });
      }
    } catch {}
    next();
  };
} catch {
  rateLimiter = (req, res, next) => next();
}

const router = express.Router();

async function pushLatency(bucketKey, value, ttlSeconds) {
  try {
    const cur = await cacheService.get(bucketKey);
    const arr = Array.isArray(cur) ? cur : (typeof cur === 'string' ? JSON.parse(cur) : []);
    arr.push(Number(value) || 0);
    const max = 1000;
    const out = arr.length > max ? arr.slice(arr.length - max) : arr;
    await cacheService.set(bucketKey, out, ttlSeconds);
  } catch {}
}

function percentiles(numbers) {
  const arr = (numbers || []).map(n => Number(n)).filter(n => Number.isFinite(n)).sort((a,b)=>a-b);
  if (!arr.length) return { p50: 0, p95: 0, p99: 0 };
  const q = (p) => arr[Math.min(arr.length - 1, Math.floor((p/100) * arr.length))];
  return { p50: q(50), p95: q(95), p99: q(99) };
}

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 5 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    return cb(new Error(`Tipo de archivo no permitido. Solo: ${allowed.join(', ')}`));
  }
});

const excelProcessor = new AcademicExcelProcessor({
  maxFileSize: 10 * 1024 * 1024,
  maxRows: 10000,
  maxColumns: 100,
  maxSheets: 10,
  allowedExtensions: ['.xlsx', '.xls', '.csv'],
  allowFormulas: false,
  allowMacros: false,
  allowHyperlinks: false,
  sanitizeHTML: true,
});

function extractSafeSample(dataBySheet, maxSheets = 3, maxRows = 5) {
  const out = {};
  const sheetNames = Object.keys(dataBySheet || {}).slice(0, maxSheets);
  for (const name of sheetNames) {
    const rows = Array.isArray(dataBySheet[name]) ? dataBySheet[name] : [];
    out[name] = rows.slice(0, maxRows);
  }
  return out;
}

router.post('/excel-validate', rateLimiter, protect, authorize(ROLES.ADMIN, ROLES.UNIVERSITY, ROLES.TEACHER, ROLES.UPLOADER), audit('EXCEL_VALIDATE'), upload.single('excelFile'), async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'No se proporcionó archivo Excel', userMessage: 'Por favor, seleccione un archivo Excel para validar' });
    }
    const options = {
      fileName: req.file.originalname,
      headerRow: Math.max(1, parseInt(req.body.headerRow, 10) || 1),
      userContext: { userId: req.user?.id || req.user?._id, role: req.user?.role, email: req.user?.email },
    };
    const t0 = Date.now();
    const result = await excelProcessor.processSecure(req.file.buffer, options);
    const processingTime = Date.now() - t0;
    const safeResponse = {
      success: result.success,
      metadata: {
        ...(result.metadata || {}),
        processingTime: `${processingTime}ms`,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        uploadTime: new Date().toISOString(),
      },
      security: {
        processorVersion: '1.0.0',
        securityLevel: 'high',
        features: { formulaBlocking: true, macroBlocking: true, htmlSanitization: true, sizeLimits: true, structureValidation: true },
        stats: excelProcessor.getSecurityReport(),
      },
      sample: result.success ? extractSafeSample(result.data, 3, 5) : null,
      warnings: result.warnings || [],
    };
    if (!result.success) {
      safeResponse.error = { code: result.internalCode || 'PROCESSING_ERROR', message: result.userMessage || 'Error procesando archivo', details: result.error };
    }
    try {
      logger.info('EXCEL_VALIDATE_RESULT', {
        userId: options.userContext.userId,
        role: options.userContext.role,
        warnings: (result.warnings || []).length,
        securityBlocks: excelProcessor.getSecurityReport().securityBlocks,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        processingTime,
        ip: req.ip,
      });
      await cacheService.increment('metrics:excel:files_total', 1);
      await cacheService.increment(`metrics:excel:role:${options.userContext.role}:files_total`, 1);
      await cacheService.increment('metrics:excel:warnings_total', (result.warnings || []).length);
      await cacheService.increment('metrics:excel:security_blocks_total', excelProcessor.getSecurityReport().securityBlocks);
      await cacheService.set(`metrics:excel:last_event`, { userId: options.userContext.userId, role: options.userContext.role, fileName: req.file.originalname, fileSize: req.file.size, warnings: (result.warnings || []).length, securityBlocks: excelProcessor.getSecurityReport().securityBlocks, timestamp: new Date().toISOString(), success: !!result.success, processingTime }, 600);
      const now = Date.now();
      const hourBucket = Math.floor(now / (60 * 60 * 1000));
      const dayBucket = Math.floor(now / (24 * 60 * 60 * 1000));
      await pushLatency(`metrics:excel:latency:hour:${hourBucket}`, processingTime, 7 * 24 * 60 * 60);
      await pushLatency(`metrics:excel:latency:day:${dayBucket}`, processingTime, 30 * 24 * 60 * 60);
      const statusKey = result.success ? 'success' : 'failure';
      await cacheService.increment(`metrics:excel:counts:hour:${hourBucket}:${statusKey}`, 1);
      await cacheService.increment(`metrics:excel:counts:day:${dayBucket}:${statusKey}`, 1);
      await cacheService.increment(`metrics:excel:role:hour:${hourBucket}:${options.userContext.role}:${statusKey}`, 1);
      await cacheService.increment(`metrics:excel:user:hour:${hourBucket}:${options.userContext.userId}:${statusKey}`, 1);
      await cacheService.increment(`metrics:excel:role:day:${dayBucket}:${options.userContext.role}:${statusKey}`, 1);
      await cacheService.increment(`metrics:excel:user:day:${dayBucket}:${options.userContext.userId}:${statusKey}`, 1);
      const lbKey = `metrics:excel:leaderboard:day:${dayBucket}`;
      try {
        const cur = await cacheService.get(lbKey);
        const obj = cur && typeof cur === 'object' ? cur : (cur ? JSON.parse(cur) : {});
        const entry = obj[options.userContext.userId] || { role: options.userContext.role, count: 0, lastSeen: new Date().toISOString() };
        entry.count += 1;
        entry.role = options.userContext.role;
        entry.lastSeen = new Date().toISOString();
        obj[options.userContext.userId] = entry;
        await cacheService.set(lbKey, obj, 30 * 24 * 60 * 60);
      } catch {}
      const io = req.app.get('io');
      try { io.emit?.('excel:metrics', { filesTotal: await cacheService.get('metrics:excel:files_total'), warningsTotal: await cacheService.get('metrics:excel:warnings_total'), securityBlocksTotal: await cacheService.get('metrics:excel:security_blocks_total') }); } catch {}
    } catch {}
    return res.status(result.success ? 200 : 400).json(safeResponse);
  } catch (error) {
    let errorCode = 'INTERNAL_ERROR';
    let userMessage = 'Error interno del servidor';
    let statusCode = 500;
    const msg = String(error.message || '');
    if (msg.includes('demasiado grande')) { errorCode = 'FILE_TOO_LARGE'; userMessage = 'El archivo excede el tamaño máximo permitido (10MB)'; statusCode = 400; }
    else if (msg.includes('no permitida')) { errorCode = 'INVALID_EXTENSION'; userMessage = 'Tipo de archivo no permitido. Solo .xlsx, .xls, .csv'; statusCode = 400; }
    else if (msg.includes('no es un Excel válido')) { errorCode = 'INVALID_FILE'; userMessage = 'El archivo no parece ser un Excel válido'; statusCode = 400; }
    return res.status(statusCode).json({ success: false, error: errorCode, message: msg, userMessage });
  }
});

router.get('/excel-validate/metrics/historical', protect, authorize(ROLES.ADMIN, ROLES.UNIVERSITY), async (req, res) => {
  try {
    const granularity = (req.query.granularity || 'hour').toLowerCase();
    const hours = Math.max(1, Math.min(parseInt(req.query.hours || '24', 10), 168));
    const days = Math.max(1, Math.min(parseInt(req.query.days || '30', 10), 90));
    const now = Date.now();
    const out = { granularity, series: [], totals: { success: 0, failure: 0 }, percentiles: { p50: 0, p95: 0, p99: 0 } };
    if (granularity === 'hour') {
      const currentBucket = Math.floor(now / (60 * 60 * 1000));
      let all = [];
      for (let i = hours - 1; i >= 0; i--) {
        const b = currentBucket - i;
        const lat = await cacheService.get(`metrics:excel:latency:hour:${b}`) || [];
        const arr = Array.isArray(lat) ? lat : (typeof lat === 'string' ? JSON.parse(lat) : []);
        const p = percentiles(arr);
        const s = Number(await cacheService.get(`metrics:excel:counts:hour:${b}:success`) || 0);
        const f = Number(await cacheService.get(`metrics:excel:counts:hour:${b}:failure`) || 0);
        out.series.push({ bucket: b, p50: p.p50, p95: p.p95, p99: p.p99, success: s, failure: f });
        out.totals.success += s;
        out.totals.failure += f;
        all = all.concat(arr);
      }
      const pAll = percentiles(all);
      out.percentiles = pAll;
    } else {
      const currentBucket = Math.floor(now / (24 * 60 * 60 * 1000));
      let all = [];
      for (let i = days - 1; i >= 0; i--) {
        const b = currentBucket - i;
        const lat = await cacheService.get(`metrics:excel:latency:day:${b}`) || [];
        const arr = Array.isArray(lat) ? lat : (typeof lat === 'string' ? JSON.parse(lat) : []);
        const p = percentiles(arr);
        const s = Number(await cacheService.get(`metrics:excel:counts:day:${b}:success`) || 0);
        const f = Number(await cacheService.get(`metrics:excel:counts:day:${b}:failure`) || 0);
        out.series.push({ bucket: b, p50: p.p50, p95: p.p95, p99: p.p99, success: s, failure: f });
        out.totals.success += s;
        out.totals.failure += f;
        all = all.concat(arr);
      }
      const pAll = percentiles(all);
      out.percentiles = pAll;
    }
    res.status(200).json({ success: true, data: out });
  } catch (e) {
    res.status(500).json({ success: false, error: 'HISTORICAL_ERROR', message: e.message });
  }
});

router.get('/excel-validate/export/csv', protect, authorize(ROLES.ADMIN, ROLES.UNIVERSITY), async (req, res) => {
  try {
    const granularity = (req.query.granularity || 'hour').toLowerCase();
    const hours = Math.max(1, Math.min(parseInt(req.query.hours || '24', 10), 168));
    const days = Math.max(1, Math.min(parseInt(req.query.days || '30', 10), 90));
    const now = Date.now();
    const rows = [];
    rows.push(['bucket','p50','p95','p99','success','failure'].join(','));
    if (granularity === 'hour') {
      const currentBucket = Math.floor(now / (60 * 60 * 1000));
      for (let i = hours - 1; i >= 0; i--) {
        const b = currentBucket - i;
        const lat = await cacheService.get(`metrics:excel:latency:hour:${b}`) || [];
        const arr = Array.isArray(lat) ? lat : (typeof lat === 'string' ? JSON.parse(lat) : []);
        const p = percentiles(arr);
        const s = Number(await cacheService.get(`metrics:excel:counts:hour:${b}:success`) || 0);
        const f = Number(await cacheService.get(`metrics:excel:counts:hour:${b}:failure`) || 0);
        rows.push([b,p.p50,p.p95,p.p99,s,f].join(','));
      }
    } else {
      const currentBucket = Math.floor(now / (24 * 60 * 60 * 1000));
      for (let i = days - 1; i >= 0; i--) {
        const b = currentBucket - i;
        const lat = await cacheService.get(`metrics:excel:latency:day:${b}`) || [];
        const arr = Array.isArray(lat) ? lat : (typeof lat === 'string' ? JSON.parse(lat) : []);
        const p = percentiles(arr);
        const s = Number(await cacheService.get(`metrics:excel:counts:day:${b}:success`) || 0);
        const f = Number(await cacheService.get(`metrics:excel:counts:day:${b}:failure`) || 0);
        rows.push([b,p.p50,p.p95,p.p99,s,f].join(','));
      }
    }
    const csv = rows.join('\n');
    const fname = `excel-metrics-${granularity}-${new Date().toISOString().slice(0,10)}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${fname}`);
    res.status(200).send(csv);
  } catch (e) {
    res.status(500).json({ success: false, error: 'EXPORT_ERROR', message: e.message });
  }
});

router.get('/excel-validate/metrics/daily', protect, authorize(ROLES.ADMIN, ROLES.UNIVERSITY), async (req, res) => {
  try {
    const days = Math.max(1, Math.min(parseInt(req.query.days || '7', 10), 90));
    const now = Date.now();
    const currentBucket = Math.floor(now / (24 * 60 * 60 * 1000));
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const b = currentBucket - i;
      const lat = await cacheService.get(`metrics:excel:latency:day:${b}`) || [];
      const arr = Array.isArray(lat) ? lat : (typeof lat === 'string' ? JSON.parse(lat) : []);
      const p = percentiles(arr);
      const s = Number(await cacheService.get(`metrics:excel:counts:day:${b}:success`) || 0);
      const f = Number(await cacheService.get(`metrics:excel:counts:day:${b}:failure`) || 0);
      const roles = {};
      for (const r of [ROLES.ADMIN, ROLES.UNIVERSITY, ROLES.TEACHER, ROLES.UPLOADER]) {
        const rs = Number(await cacheService.get(`metrics:excel:role:day:${b}:${r}:success`) || 0);
        const rf = Number(await cacheService.get(`metrics:excel:role:day:${b}:${r}:failure`) || 0);
        roles[r] = { success: rs, failure: rf };
      }
      out.push({ bucket: b, totals: { success: s, failure: f }, percentiles: p, roles });
    }
    res.status(200).json({ success: true, data: out });
  } catch (e) {
    res.status(500).json({ success: false, error: 'DAILY_ERROR', message: e.message });
  }
});

function classifyPerformance(success, failure, p95) {
  const total = success + failure;
  const rate = total > 0 ? (success / total) * 100 : 0;
  if (p95 < 500 && rate >= 98) return 'Excelente';
  if (p95 < 1000 && rate >= 95) return 'Bueno';
  if (p95 < 2000 && rate >= 90) return 'Aceptable';
  return 'Necesita mejora';
}

router.get('/excel-validate/metrics/role-summary', protect, authorize(ROLES.ADMIN, ROLES.UNIVERSITY), async (req, res) => {
  try {
    const days = Math.max(1, Math.min(parseInt(req.query.days || '7', 10), 90));
    const now = Date.now();
    const currentBucket = Math.floor(now / (24 * 60 * 60 * 1000));
    const rolesList = [ROLES.ADMIN, ROLES.UNIVERSITY, ROLES.TEACHER, ROLES.UPLOADER];
    const summary = {};
    for (const role of rolesList) { summary[role] = { success: 0, failure: 0, p95s: [] }; }
    for (let i = days - 1; i >= 0; i--) {
      const b = currentBucket - i;
      const lat = await cacheService.get(`metrics:excel:latency:day:${b}`) || [];
      const arr = Array.isArray(lat) ? lat : (typeof lat === 'string' ? JSON.parse(lat) : []);
      const p = percentiles(arr);
      for (const role of rolesList) {
        const rs = Number(await cacheService.get(`metrics:excel:role:day:${b}:${role}:success`) || 0);
        const rf = Number(await cacheService.get(`metrics:excel:role:day:${b}:${role}:failure`) || 0);
        summary[role].success += rs;
        summary[role].failure += rf;
        summary[role].p95s.push(p.p95);
      }
    }
    const prevSummary = {};
    for (const role of rolesList) { prevSummary[role] = { success: 0, failure: 0, p95s: [] }; }
    for (let i = (2 * days) - 1; i >= days; i--) {
      const b = currentBucket - i;
      const lat = await cacheService.get(`metrics:excel:latency:day:${b}`) || [];
      const arr = Array.isArray(lat) ? lat : (typeof lat === 'string' ? JSON.parse(lat) : []);
      const p = percentiles(arr);
      for (const role of rolesList) {
        const rs = Number(await cacheService.get(`metrics:excel:role:day:${b}:${role}:success`) || 0);
        const rf = Number(await cacheService.get(`metrics:excel:role:day:${b}:${role}:failure`) || 0);
        prevSummary[role].success += rs;
        prevSummary[role].failure += rf;
        prevSummary[role].p95s.push(p.p95);
      }
    }
    const out = rolesList.map(role => {
      const s = summary[role];
      const avgP95 = s.p95s.length ? Math.round(s.p95s.reduce((a,b)=>a+b,0)/s.p95s.length) : 0;
      const classification = classifyPerformance(s.success, s.failure, avgP95);
      const total = s.success + s.failure;
      const successRate = total ? ((s.success / total) * 100).toFixed(2) : '0.00';
      const ps = prevSummary[role];
      const prevTotal = ps.success + ps.failure;
      const prevSuccessRate = prevTotal ? ((ps.success / prevTotal) * 100).toFixed(2) : '0.00';
      const prevAvgP95 = ps.p95s.length ? Math.round(ps.p95s.reduce((a,b)=>a+b,0)/ps.p95s.length) : 0;
      const deltaSuccessRate = (parseFloat(successRate) - parseFloat(prevSuccessRate)).toFixed(2);
      const deltaAvgP95 = avgP95 - prevAvgP95;
      return { role, success: s.success, failure: s.failure, total, successRate, avgP95, classification, trend: { prevTotal, prevSuccessRate, prevAvgP95, deltaSuccessRate, deltaAvgP95 } };
    });
    res.status(200).json({ success: true, data: out });
  } catch (e) {
    res.status(500).json({ success: false, error: 'ROLE_SUMMARY_ERROR', message: e.message });
  }
});

router.get('/excel-validate/metrics/user-activity', protect, authorize(ROLES.ADMIN, ROLES.UNIVERSITY), async (req, res) => {
  try {
    const days = Math.max(1, Math.min(parseInt(req.query.days || '7', 10), 90));
    const now = Date.now();
    const currentDay = Math.floor(now / (24 * 60 * 60 * 1000));
    const aggregate = new Map();
    const addUser = (userId, role, count, success, failure, lastSeen) => {
      const cur = aggregate.get(userId) || { userId, role, count: 0, success: 0, failure: 0, daysActive: 0, lastSeen: null };
      cur.count += count;
      cur.success += success;
      cur.failure += failure;
      cur.role = role || cur.role;
      cur.daysActive += 1;
      cur.lastSeen = lastSeen || cur.lastSeen;
      aggregate.set(userId, cur);
    };
    for (let i = days - 1; i >= 0; i--) {
      const db = currentDay - i;
      const lb = await cacheService.get(`metrics:excel:leaderboard:day:${db}`);
      const obj = lb && typeof lb === 'object' ? lb : (lb ? JSON.parse(lb) : {});
      for (const [userId, entry] of Object.entries(obj)) {
        const s = Number(await cacheService.get(`metrics:excel:user:day:${db}:${userId}:success`) || 0);
        const f = Number(await cacheService.get(`metrics:excel:user:day:${db}:${userId}:failure`) || 0);
        addUser(userId, entry.role, Number(entry.count || 0), s, f, entry.lastSeen);
      }
    }
    const list = Array.from(aggregate.values()).sort((a,b)=>b.count - a.count).slice(0,50).map(u => {
      const total = u.success + u.failure;
      const successRate = total ? ((u.success / total) * 100).toFixed(2) : '0.00';
      return { userId: u.userId, role: u.role, count: u.count, success: u.success, failure: u.failure, successRate, daysActive: u.daysActive, lastSeen: u.lastSeen };
    });
    res.status(200).json({ success: true, data: list });
  } catch (e) {
    res.status(500).json({ success: false, error: 'USER_ACTIVITY_ERROR', message: e.message });
  }
});

router.get('/excel-validate/export/role-summary', protect, authorize(ROLES.ADMIN, ROLES.UNIVERSITY), async (req, res) => {
  try {
    const days = Math.max(1, Math.min(parseInt(req.query.days || '7', 10), 90));
    const now = Date.now();
    const currentBucket = Math.floor(now / (24 * 60 * 60 * 1000));
    const rolesList = [ROLES.ADMIN, ROLES.UNIVERSITY, ROLES.TEACHER, ROLES.UPLOADER];
    const summary = {}; const prevSummary = {};
    for (const role of rolesList) { summary[role] = { success: 0, failure: 0, p95s: [] }; prevSummary[role] = { success: 0, failure: 0, p95s: [] }; }
    for (let i = days - 1; i >= 0; i--) {
      const b = currentBucket - i;
      const lat = await cacheService.get(`metrics:excel:latency:day:${b}`) || [];
      const arr = Array.isArray(lat) ? lat : (typeof lat === 'string' ? JSON.parse(lat) : []);
      const p = percentiles(arr);
      for (const role of rolesList) {
        const rs = Number(await cacheService.get(`metrics:excel:role:day:${b}:${role}:success`) || 0);
        const rf = Number(await cacheService.get(`metrics:excel:role:day:${b}:${role}:failure`) || 0);
        summary[role].success += rs; summary[role].failure += rf; summary[role].p95s.push(p.p95);
      }
    }
    for (let i = (2 * days) - 1; i >= days; i--) {
      const b = currentBucket - i;
      const lat = await cacheService.get(`metrics:excel:latency:day:${b}`) || [];
      const arr = Array.isArray(lat) ? lat : (typeof lat === 'string' ? JSON.parse(lat) : []);
      const p = percentiles(arr);
      for (const role of rolesList) {
        const rs = Number(await cacheService.get(`metrics:excel:role:day:${b}:${role}:success`) || 0);
        const rf = Number(await cacheService.get(`metrics:excel:role:day:${b}:${role}:failure`) || 0);
        prevSummary[role].success += rs; prevSummary[role].failure += rf; prevSummary[role].p95s.push(p.p95);
      }
    }
    const rows = [['role','success','failure','total','successRate','avgP95','classification','prevTotal','prevSuccessRate','prevAvgP95','deltaSuccessRate','deltaAvgP95'].join(',')];
    for (const role of rolesList) {
      const s = summary[role]; const ps = prevSummary[role];
      const total = s.success + s.failure; const prevTotal = ps.success + ps.failure;
      const successRate = total ? ((s.success / total) * 100).toFixed(2) : '0.00';
      const prevSuccessRate = prevTotal ? ((ps.success / prevTotal) * 100).toFixed(2) : '0.00';
      const avgP95 = s.p95s.length ? Math.round(s.p95s.reduce((a,b)=>a+b,0)/s.p95s.length) : 0;
      const prevAvgP95 = ps.p95s.length ? Math.round(ps.p95s.reduce((a,b)=>a+b,0)/ps.p95s.length) : 0;
      const classification = classifyPerformance(s.success, s.failure, avgP95);
      const deltaSuccessRate = (parseFloat(successRate) - parseFloat(prevSuccessRate)).toFixed(2);
      const deltaAvgP95 = avgP95 - prevAvgP95;
      rows.push([role, s.success, s.failure, total, successRate, avgP95, classification, prevTotal, prevSuccessRate, prevAvgP95, deltaSuccessRate, deltaAvgP95].join(','));
    }
    const csv = rows.join('\n');
    const fname = `excel-role-summary-${new Date().toISOString().slice(0,10)}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${fname}`);
    res.status(200).send(csv);
  } catch (e) {
    res.status(500).json({ success: false, error: 'EXPORT_ROLE_ERROR', message: e.message });
  }
});

router.get('/excel-metrics', protect, authorize(ROLES.ADMIN, ROLES.UNIVERSITY), async (req, res) => {
  try {
    const data = await cacheService.mget([
      'metrics:excel:files_total',
      'metrics:excel:warnings_total',
      'metrics:excel:security_blocks_total',
      `metrics:excel:role:${ROLES.ADMIN}:files_total`,
      `metrics:excel:role:${ROLES.UNIVERSITY}:files_total`,
      `metrics:excel:role:${ROLES.TEACHER}:files_total`,
      `metrics:excel:role:${ROLES.UPLOADER}:files_total`,
      'metrics:excel:last_event'
    ]);
    res.status(200).json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: 'METRICS_ERROR', message: e.message });
  }
});

router.get('/security-report', protect, authorize(ROLES.ADMIN), async (req, res) => {
  try {
    const data = await cacheService.mget([
      'metrics:excel:security_blocks_total',
      'metrics:excel:warnings_total',
      'metrics:excel:last_event'
    ]);
    res.status(200).json({ success: true, data, generatedAt: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ success: false, error: 'SECURITY_REPORT_ERROR', message: e.message });
  }
});

router.get('/logs/:date', protect, authorize(ROLES.ADMIN), async (req, res) => {
  try {
    const date = req.params.date;
    const pathLib = require('path');
    const fs = require('fs');
    const filePath = pathLib.join(process.cwd(), 'server', 'logs', `combined-${date}.log`);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, error: 'LOG_NOT_FOUND' });
    res.setHeader('Content-Type', 'text/plain');
    res.sendFile(filePath);
  } catch (e) {
    res.status(500).json({ success: false, error: 'LOGS_ERROR', message: e.message });
  }
});

module.exports = router;
