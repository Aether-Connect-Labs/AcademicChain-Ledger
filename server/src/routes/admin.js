const express = require('express');
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/auth');
const { User } = require('../models');
const ROLES = require('../config/roles');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validator');
const monitoringService = require('../services/monitoringService');
const recoveryService = require('../services/recoveryService');
const { query } = require('express-validator');
const hederaService = require('../services/hederaServices');
const xrpService = require('../services/xrpService');
const algorandService = require('../services/algorandService');
const partnerService = require('../services/partnerService');
const { cacheMiddleware } = require('../middleware/cache');

const router = express.Router();

// Todas las rutas en este archivo están protegidas y son solo para administradores
router.use(protect, authorize(ROLES.ADMIN));
router.use((req, res, next) => {
  const isProd = String(process.env.NODE_ENV).toLowerCase() === 'production';
  if (isProd) {
    const email = String(process.env.SUPER_ADMIN_EMAIL || '').toLowerCase();
    if (email && String(req.user?.email || '').toLowerCase() !== email) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
  }
  next();
});

/**
 * @route   GET /api/admin/users
 * @desc    Obtener todos los usuarios
 * @access  Private (Admin only)
 */
router.get('/users', asyncHandler(async (req, res) => {
  const users = await User.find({}).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: users });
}));

router.get('/metrics', asyncHandler(async (req, res) => {
  const list = await monitoringService.list(req.query.limit);
  res.status(200).json({ success: true, data: list });
}));

router.post('/metrics/snapshot', asyncHandler(async (req, res) => {
  const doc = await monitoringService.snapshot();
  res.status(201).json({ success: true, data: doc });
}));

router.post('/recovery/backup',
  [ body('dir').optional().isString() ],
  validate,
  asyncHandler(async (req, res) => {
    const { dir } = req.body || {};
    const result = await recoveryService.backup(dir || process.env.BACKUP_DIR);
    res.status(201).json({ success: true, data: result });
  })
);

router.post('/recovery/restore',
  [ body('dir').notEmpty().isString().withMessage('dir is required') ],
  validate,
  asyncHandler(async (req, res) => {
    const { dir } = req.body;
    const result = await recoveryService.restore(dir);
    res.status(200).json({ success: true, data: result });
  })
);

router.get('/hedera/balance',
  [ query('accountId').optional().isString() ],
  validate,
  asyncHandler(async (req, res) => {
    await hederaService.connect();
    const accountId = req.query.accountId || req.user.hederaAccountId;
    if (!accountId) {
      return res.status(400).json({ success: false, message: 'accountId requerido o vincula hederaAccountId al usuario' });
    }
    const bal = await hederaService.getAccountBalance(accountId);
    res.status(200).json({ success: true, data: bal });
  })
);

router.get('/xrp/status', cacheMiddleware(60), asyncHandler(async (req, res) => {
  try { await xrpService.connect(); } catch {}
  const anchorEnabled = String(process.env.ENABLE_XRP_ANCHOR || '0') === '1';
  const enabled = (typeof xrpService.isEnabled === 'function' ? xrpService.isEnabled() : false) || anchorEnabled;
  res.status(200).json({ success: true, data: { enabled, network: xrpService.network || process.env.XRPL_NETWORK || (anchorEnabled ? 'testnet' : 'disabled') } });
}));

router.get('/xrp/balance', cacheMiddleware(60), asyncHandler(async (req, res) => {
  try { await xrpService.connect(); } catch {}
  const data = await xrpService.getBalance();
  res.status(200).json({ success: true, data });
}));

router.get('/algorand/status', cacheMiddleware(60), asyncHandler(async (req, res) => {
  try { await algorandService.connect(); } catch {}
  const enabled = typeof algorandService.isEnabled === 'function' ? algorandService.isEnabled() : false;
  res.status(200).json({ success: true, data: { enabled, network: algorandService.network || 'disabled' } });
}));

router.get('/algorand/balance', cacheMiddleware(60), asyncHandler(async (req, res) => {
  try { await algorandService.connect(); } catch {}
  const data = await algorandService.getBalance();
  res.status(200).json({ success: true, data });
}));

router.get('/health/detailed', asyncHandler(async (req, res) => {
  const alerts = await require('../services/cacheService').get('alerts:system:list') || [];
  const svc = await require('../services/cacheService').mget([
    'metrics:svc_health:mongodb',
    'metrics:svc_health:redis',
    'metrics:svc_health:hedera',
    'metrics:svc_health:xrpl',
    'metrics:svc_health:rate_oracle',
    'metrics:svc_latency_ms:mongodb',
    'metrics:svc_latency_ms:redis',
    'metrics:svc_latency_ms:hedera',
    'metrics:svc_latency_ms:xrpl',
    'metrics:svc_latency_ms:rate_oracle',
    'metrics:hedera_balance_hbars'
  ]);
  const rateHealth = await require('../services/rateOracle').health();
  const recommendations = [];
  const mapSvc = (name) => ({ healthy: !!svc[`metrics:svc_health:${name}`], latencyMs: Number(svc[`metrics:svc_latency_ms:${name}`] || 0) });
  for (const name of ['mongodb','redis','hedera','xrpl','rate_oracle']) {
    const d = mapSvc(name);
    if (!d.healthy) recommendations.push(`check ${name} connectivity`);
    else if (d.latencyMs > parseInt(process.env.RUNTIME_DEGRADE_THRESHOLD_MS || '5000', 10)) recommendations.push(`increase ${name} timeout or investigate latency`);
  }
  res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mapSvc('mongodb'),
      redis: mapSvc('redis'),
      hedera: { ...mapSvc('hedera'), balanceHbars: Number(svc['metrics:hedera_balance_hbars'] || 0) },
      xrpl: mapSvc('xrpl'),
      rate_oracle: { ...mapSvc('rate_oracle'), ageSeconds: rateHealth.ageSeconds, sources: rateHealth.sourcesActive }
    },
    alerts,
    recommendations
  });
}));

router.get('/system-status', cacheMiddleware(60), asyncHandler(async (req, res) => {
  const alerts = await require('../services/cacheService').get('alerts:system:list') || [];
  const svc = await require('../services/cacheService').mget([
    'metrics:svc_health:mongodb',
    'metrics:svc_health:redis',
    'metrics:svc_health:hedera',
    'metrics:svc_health:xrpl',
    'metrics:svc_health:rate_oracle',
    'metrics:svc_latency_ms:mongodb',
    'metrics:svc_latency_ms:redis',
    'metrics:svc_latency_ms:hedera',
    'metrics:svc_latency_ms:xrpl',
    'metrics:svc_latency_ms:rate_oracle',
    'metrics:hedera_balance_hbars'
  ]);
  const rateHealth = await require('../services/rateOracle').health();
  const recommendations = [];
  const mapSvc = (name) => ({ healthy: !!svc[`metrics:svc_health:${name}`], latencyMs: Number(svc[`metrics:svc_latency_ms:${name}`] || 0) });
  for (const name of ['mongodb','redis','hedera','xrpl','rate_oracle']) {
    const d = mapSvc(name);
    if (!d.healthy) recommendations.push(`check ${name} connectivity`);
    else if (d.latencyMs > parseInt(process.env.RUNTIME_DEGRADE_THRESHOLD_MS || '5000', 10)) recommendations.push(`increase ${name} timeout or investigate latency`);
  }
  res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mapSvc('mongodb'),
      redis: mapSvc('redis'),
      hedera: { ...mapSvc('hedera'), balanceHbars: Number(svc['metrics:hedera_balance_hbars'] || 0) },
      xrpl: mapSvc('xrpl'),
      rate_oracle: { ...mapSvc('rate_oracle'), ageSeconds: rateHealth.ageSeconds, sources: rateHealth.sourcesActive }
    },
    alerts,
    recommendations
  });
}));

router.get('/institutions/stats', asyncHandler(async (req, res) => {
  try {
    const { isConnected } = require('../config/database');
    const disableMongo = process.env.DISABLE_MONGO === '1' || !isConnected();
    if (disableMongo) {
      return res.status(200).json({ success: true, data: { pending: 0, approved: 0, rejected: 0, total: 0, recent: [] } });
    }
    const roleStats = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);
    const recentInstitutions = await User.find({ role: { $in: ['pending_university', 'university', 'student'] } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email universityName role createdAt approvedAt')
      .lean();
    const stats = { pending: 0, approved: 0, rejected: 0, total: 0, recent: recentInstitutions.map(inst => ({ id: inst._id, name: inst.name, email: inst.email, universityName: inst.universityName, role: inst.role, createdAt: inst.createdAt, approvedAt: inst.approvedAt })) };
    for (const s of roleStats) {
      if (s._id === 'pending_university') stats.pending = s.count;
      if (s._id === 'university') stats.approved = s.count;
      if (s._id === 'student') stats.rejected = s.count;
      stats.total += s.count;
    }
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(200).json({ success: true, data: { pending: 0, approved: 0, rejected: 0, total: 0, recent: [] }, degraded: true, message: 'MongoDB no disponible' });
  }
}));

router.get('/usage/by-institution', cacheMiddleware(120), asyncHandler(async (req, res) => {
  const { Credential, Token, User } = require('../models');
  const { isConnected } = require('../config/database');
  const disableMongo = process.env.DISABLE_MONGO === '1';
  if (disableMongo || !isConnected()) return res.status(200).json({ success: true, data: [], degraded: true });
  try {
    const agg = await Credential.aggregate([{ $group: { _id: '$universityId', credentials: { $sum: 1 } } }]);
    const uniIds = agg.map(a => a._id).filter(Boolean);
    const tokensAgg = await Token.aggregate([{ $match: { universityId: { $in: uniIds } } }, { $group: { _id: '$universityId', tokens: { $sum: 1 } } }]);
    const AnalyticsEvent = require('../models/AnalyticsEvent');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const verAgg = await AnalyticsEvent.aggregate([{ $match: { type: { $in: ['CREDENTIAL_VERIFIED', 'PARTNER_VERIFICATION'] }, 'data.universityId': { $in: uniIds }, timestamp: { $gte: thirtyDaysAgo } } }, { $group: { _id: '$data.universityId', verifications30d: { $sum: 1 } } }]);
    const mapTokens = Object.fromEntries(tokensAgg.map(t => [String(t._id), t.tokens]));
    const mapVer = Object.fromEntries(verAgg.map(v => [String(v._id), v.verifications30d]));
    const users = await User.find({ _id: { $in: uniIds } }).select('id universityName email').lean();
    const mapUser = Object.fromEntries(users.map(u => [String(u._id), u]));
    const result = agg.map(a => {
      const id = String(a._id);
      return { universityId: id, universityName: mapUser[id]?.universityName || '', email: mapUser[id]?.email || '', credentials: a.credentials, activeTokens: mapTokens[id] || 0, verifications30d: mapVer[id] || 0 };
    }).sort((x,y) => y.credentials - x.credentials);
    return res.status(200).json({ success: true, data: result, generatedAt: new Date().toISOString() });
  } catch (e) {
    return res.status(200).json({ success: true, data: [], degraded: true, message: 'MongoDB no disponible' });
  }
}));

router.get('/billing/consumption', cacheMiddleware(300), asyncHandler(async (req, res) => {
  const rateCred = parseFloat(String(process.env.BILLING_RATE_PER_CREDENTIAL || '0')) || 0;
  const rateVerify = parseFloat(String(process.env.BILLING_RATE_PER_VERIFICATION || '0')) || 0;
  const { Credential } = require('../models');
  const AnalyticsEvent = require('../models/AnalyticsEvent');
  const agg = await Credential.aggregate([{ $group: { _id: '$universityId', credentials: { $sum: 1 } } }]);
  const uniIds = agg.map(a => a._id).filter(Boolean);
  const verAgg = await AnalyticsEvent.aggregate([{ $match: { type: { $in: ['CREDENTIAL_VERIFIED', 'PARTNER_VERIFICATION'] }, 'data.universityId': { $in: uniIds } } }, { $group: { _id: '$data.universityId', verifications: { $sum: 1 } } }]);
  const mapVer = Object.fromEntries(verAgg.map(v => [String(v._id), v.verifications]));
  const users = await User.find({ _id: { $in: uniIds } }).select('id universityName email').lean();
  const mapUser = Object.fromEntries(users.map(u => [String(u._id), u]));
  const items = agg.map(a => {
    const id = String(a._id);
    const ver = mapVer[id] || 0;
    const cost = (a.credentials * rateCred) + (ver * rateVerify);
    return { universityId: id, universityName: mapUser[id]?.universityName || '', email: mapUser[id]?.email || '', credentials: a.credentials, verifications: ver, estimatedCost: Number(cost.toFixed(4)) };
  });
  res.status(200).json({ success: true, data: items, currency: process.env.BILLING_CURRENCY || 'USD', rates: { perCredential: rateCred, perVerification: rateVerify } });
}));

router.get('/alerts/config', asyncHandler(async (req, res) => {
  const cfg = await require('../services/cacheService').mget([
    'alerts:config:svc_latency_threshold_ms',
    'alerts:config:enable_email',
    'alerts:config:enable_socket',
    'alerts:config:rate_oracle_age_warning_s'
  ]);
  res.status(200).json({ success: true, data: cfg });
}));

router.post('/alerts/config', asyncHandler(async (req, res) => {
  const kv = {};
  if (req.body.svcLatencyThresholdMs !== undefined) kv['alerts:config:svc_latency_threshold_ms'] = Number(req.body.svcLatencyThresholdMs);
  if (req.body.enableEmail !== undefined) kv['alerts:config:enable_email'] = req.body.enableEmail ? 1 : 0;
  if (req.body.enableSocket !== undefined) kv['alerts:config:enable_socket'] = req.body.enableSocket ? 1 : 0;
  if (req.body.rateOracleAgeWarningS !== undefined) kv['alerts:config:rate_oracle_age_warning_s'] = Number(req.body.rateOracleAgeWarningS);
  await require('../services/cacheService').mset(kv, 3600);
  res.status(200).json({ success: true });
}));

router.get('/reports/credentials.csv', asyncHandler(async (req, res) => {
  const { Credential } = require('../models');
  const list = await Credential.find({}).select('tokenId serialNumber ipfsURI uniqueHash universityId createdAt').lean();
  const xrps = await Promise.all(list.map(c => require('../services/xrpService').getByHash(c.uniqueHash).catch(() => null)));
  const algos = await Promise.all(list.map(c => require('../models').AlgorandAnchor.findOne({ certificateHash: c.uniqueHash }).sort({ createdAt: -1 }).catch(() => null)));
  const rows = [['universityId','tokenId','serialNumber','uniqueHash','ipfsURI','createdAt','hasXRPL','hasAlgorand']].concat(
    list.map((c, i) => [c.universityId || '', c.tokenId, c.serialNumber, c.uniqueHash, c.ipfsURI || '', (c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt), xrps[i]?.xrpTxHash ? '1' : '0', algos[i]?.algoTxId ? '1' : '0'])
  );
  const csv = rows.map(r => r.map(v => typeof v === 'string' && v.includes(',') ? `"${v.replace(/"/g,'""')}"` : (v ?? '')).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="credentials_anchors.csv"');
  return res.status(200).send(csv);
}));

router.get('/reports/compliance.csv', asyncHandler(async (req, res) => {
  const { Credential } = require('../models');
  const total = await Credential.countDocuments();
  const pipeline = [
    { $lookup: { from: 'xrpanchors', localField: 'uniqueHash', foreignField: 'certificateHash', as: 'xrp' } },
    { $lookup: { from: 'algorandanchors', localField: 'uniqueHash', foreignField: 'certificateHash', as: 'algo' } },
    { $project: { tokenId: 1, serialNumber: 1, universityId: 1, hasXrp: { $gt: [{ $size: '$xrp' }, 0] }, hasAlgo: { $gt: [{ $size: '$algo' }, 0] }, createdAt: 1 } },
  ];
  const docs = await Credential.aggregate(pipeline);
  const rows = [['tokenId','serialNumber','universityId','createdAt','xrpl','algorand']].concat(
    docs.map(c => [c.tokenId, c.serialNumber, c.universityId || '', (c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt), c.hasXrp ? 'yes' : 'no', c.hasAlgo ? 'yes' : 'no'])
  );
  const csv = rows.map(r => r.join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="compliance_report.csv"');
  return res.status(200).send(csv);
}));

router.get('/reports/backup-stats.pdf', asyncHandler(async (req, res) => {
  const stats = await require('../services/cacheService').get('backup_stats');
  const s = stats || { totalCredentials: 0, tripleBacked: 0, hederaOnly: 0 };
  const lines = [
    `AcademicChain Ledger`,
    `Backup Stats`,
    `Date: ${new Date().toISOString()}`,
    `Total Credentials: ${s.totalCredentials}`,
    `Triple Backed: ${s.tripleBacked}`,
    `Hedera Only: ${s.hederaOnly}`
  ];
  const content = lines.join('\\n');
  const text = `BT\n/F1 12 Tf\n72 720 Td\n(${content.replace(/\(/g,'\\(').replace(/\)/g,'\\)')}) Tj\nET`;
  const objects = [];
  objects.push({ id: 1, data: '<< /Type /Catalog /Pages 2 0 R >>' });
  objects.push({ id: 2, data: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>' });
  const pageSize = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>';
  objects.push({ id: 3, data: pageSize });
  objects.push({ id: 4, data: `<< /Length ${text.length} >>\nstream\n${text}\nendstream` });
  objects.push({ id: 5, data: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>' });
  let pdf = '%PDF-1.4\\n';
  const xrefs = [];
  for (const obj of objects) {
    xrefs.push(pdf.length);
    pdf += `${obj.id} 0 obj\\n${obj.data}\\nendobj\\n`;
  }
  const xrefPos = pdf.length;
  pdf += `xref\\n0 ${objects.length + 1}\\n0000000000 65535 f \\n`;
  for (const pos of xrefs) {
    pdf += `${String(pos).padStart(10, '0')} 00000 n \\n`;
  }
  pdf += `trailer\\n<< /Size ${objects.length + 1} /Root 1 0 R >>\\nstartxref\\n${xrefPos}\\n%%EOF`;
  const buf = Buffer.from(pdf, 'binary');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="backup-stats.pdf"');
  res.status(200).send(buf);
}));

/**
 * @route   PATCH /api/admin/users/:id/status
 * @desc    Actualizar el estado de activación de un usuario
 * @access  Private (Admin only)
 */
router.patch('/users/:id/status',
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    res.status(200).json({ success: true, message: `User ${user.email} status updated to ${isActive ? 'active' : 'inactive'}.`, data: user });
  })
);

router.get('/backup-stats', cacheMiddleware(120), asyncHandler(async (req, res) => {
  const { Credential } = require('../models');
  const total = await Credential.countDocuments();
  const pipeline = [
    { $lookup: { from: 'xrpanchors', localField: 'uniqueHash', foreignField: 'certificateHash', as: 'xrp' } },
    { $lookup: { from: 'algorandanchors', localField: 'uniqueHash', foreignField: 'certificateHash', as: 'algo' } },
    { $project: { hasXrp: { $gt: [{ $size: '$xrp' }, 0] }, hasAlgo: { $gt: [{ $size: '$algo' }, 0] } } },
    { $match: { hasXrp: true, hasAlgo: true } },
    { $count: 'count' }
  ];
  const r = await Credential.aggregate(pipeline);
  const tripleBacked = (r[0]?.count || 0);
  const hederaOnly = Math.max(0, total - tripleBacked);
  res.status(200).json({ success: true, data: { totalCredentials: total, tripleBacked, hederaOnly } });
}));

module.exports = router;
router.get('/bookings', asyncHandler(async (req, res) => {
  const { Booking } = require('../models');
  const list = await Booking.find({}).sort({ createdAt: -1 }).limit(200);
  res.status(200).json({ success: true, data: list });
}));

router.patch('/bookings/:id/status',
  [ param('id').isMongoId().withMessage('Invalid booking ID'), body('status').isString().trim().isLength({ min: 3, max: 32 }) ],
  validate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const { Booking } = require('../models');
    const doc = await Booking.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Booking not found' });
    doc.status = status;
    await doc.save();
    res.status(200).json({ success: true, data: doc });
  })
);
router.get('/pending-institutions', asyncHandler(async (req, res) => {
  const { User } = require('../models');
  const list = await User.find({ role: ROLES.PENDING_UNIVERSITY }).sort({ createdAt: -1 }).select('id email name universityName createdAt');
  res.status(200).json({ success: true, data: list });
}));

router.post('/approve-institution/:id',
  [ param('id').isMongoId().withMessage('Invalid user ID') ],
  validate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { User } = require('../models');
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.role = ROLES.UNIVERSITY;
    user.isActive = true;
    await user.save();
    const displayName = user.universityName || user.name || `Institution_${user.id}`;
    const issued = await partnerService.generateApiKey(displayName);
    issued.partner.universityId = user.id;
    issued.partner.permissions = Array.from(new Set([...(issued.partner.permissions||[]), 'verify_credential', 'mint_credential']));
    await issued.partner.save();
    res.status(200).json({ success: true, message: 'Institution approved', data: { id: user.id, role: user.role, partnerId: issued.partner.id, partnerApiKey: issued.apiKey } });
  })
);

router.post('/reject-institution/:id',
  [ param('id').isMongoId().withMessage('Invalid user ID') ],
  validate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { User } = require('../models');
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.role = 'student';
    user.isActive = false;
    await user.save();
    res.status(200).json({ success: true, message: 'Institution rejected', data: { id: user.id, role: user.role } });
  })
);
