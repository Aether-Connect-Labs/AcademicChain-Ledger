const router = require('express').Router();
const { body } = require('express-validator');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Developer } = require('../../models');
const { validate } = require('../../middleware/validator');
const apiKeyAuth = require('../../middleware/apiKeyAuth');
const cacheService = require('../../services/cacheService');

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('name').notEmpty().trim(),
  body('password').isLength({ min: 6 }),
  body('plan').optional().isIn(['free','startup','enterprise'])
], validate, asyncHandler(async (req, res) => {
  const { email, name, password, plan = 'free' } = req.body;
  const exists = await Developer.findOne({ email });
  if (exists) return res.status(409).json({ success: false, message: 'Email already registered' });
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const verificationToken = Math.random().toString(36).slice(2);
  const dev = await Developer.create({ email, name, passwordHash, plan, verificationToken });
  res.status(201).json({ success: true, message: 'Registered. Verify email.', data: { verificationToken: dev.verificationToken } });
}));

router.post('/verify-email', [
  body('token').notEmpty().trim()
], validate, asyncHandler(async (req, res) => {
  const { token } = req.body;
  const dev = await Developer.findOne({ verificationToken: token });
  if (!dev) return res.status(404).json({ success: false, message: 'Invalid token' });
  dev.emailVerified = true; dev.verificationToken = null; await dev.save();
  res.status(200).json({ success: true, message: 'Email verified' });
}));

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], validate, asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const dev = await Developer.findOne({ email, isActive: true });
  if (!dev) return res.status(404).json({ success: false, message: 'Developer not found' });
  const ok = await bcrypt.compare(password, dev.passwordHash);
  if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });
  if (!dev.emailVerified) return res.status(403).json({ success: false, message: 'Email not verified' });
  const token = jwt.sign({ devId: dev.id, role: 'developer' }, process.env.JWT_SECRET, { expiresIn: '24h' });
  res.status(200).json({ success: true, data: { token } });
}));

router.post('/api-keys/issue', [
  body('name').optional().isString()
], validate, asyncHandler(async (req, res) => {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Missing token' });
  const token = auth.slice(7);
  let payload; try { payload = jwt.verify(token, process.env.JWT_SECRET); } catch { return res.status(401).json({ success: false, message: 'Invalid token' }); }
  const dev = await Developer.findById(payload.devId);
  if (!dev) return res.status(404).json({ success: false, message: 'Developer not found' });
  const prefix = `ak_${Math.random().toString(36).slice(2, 10)}`;
  const secret = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(secret, salt);
  // Guardar como clave activa en historial
  dev.apiKeyPrefix = prefix; dev.apiKeyHash = hash;
  dev.apiKeys = Array.isArray(dev.apiKeys) ? [{ prefix, hash, status: 'active', createdAt: new Date() }, ...dev.apiKeys] : [{ prefix, hash, status: 'active', createdAt: new Date() }];
  await dev.save();
  const fullKey = `${prefix}_${secret}`;
  res.status(201).json({ success: true, data: { apiKey: fullKey } });
}));

router.get('/api-keys', asyncHandler(async (req, res) => {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Missing token' });
  const token = auth.slice(7);
  let payload; try { payload = jwt.verify(token, process.env.JWT_SECRET); } catch { return res.status(401).json({ success: false, message: 'Invalid token' }); }
  const dev = await Developer.findById(payload.devId);
  if (!dev) return res.status(404).json({ success: false, message: 'Developer not found' });
  const list = (dev.apiKeys || []).map(k => ({
    apiKey: k.prefix,
    status: k.status,
    createdAt: k.createdAt,
    lastUsedAt: k.lastUsedAt
  }));
  res.status(200).json({ success: true, data: { apiKeys: list } });
}));

router.post('/api-keys/revoke', [
  body('apiKey').notEmpty().isString()
], validate, asyncHandler(async (req, res) => {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Missing token' });
  const token = auth.slice(7);
  let payload; try { payload = jwt.verify(token, process.env.JWT_SECRET); } catch { return res.status(401).json({ success: false, message: 'Invalid token' }); }
  const dev = await Developer.findById(payload.devId);
  if (!dev) return res.status(404).json({ success: false, message: 'Developer not found' });
  const incoming = String(req.body.apiKey || '');
  const parts = incoming.split('_');
  const prefix = parts.length >= 2 ? `${parts[0]}_${parts[1]}` : incoming;
  let updated = false;
  if (Array.isArray(dev.apiKeys)) {
    for (const k of dev.apiKeys) {
      if (k.prefix === prefix && k.status === 'active') {
        k.status = 'revoked'; k.revokedAt = new Date(); updated = true;
      }
    }
  }
  if (dev.apiKeyPrefix === prefix) {
    dev.apiKeyPrefix = null; dev.apiKeyHash = null;
  }
  await dev.save();
  res.status(200).json({ success: true, data: { revoked: updated } });
}));

router.post('/api-keys/rotate', [
  body('apiKey').notEmpty().isString()
], validate, asyncHandler(async (req, res) => {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Missing token' });
  const token = auth.slice(7);
  let payload; try { payload = jwt.verify(token, process.env.JWT_SECRET); } catch { return res.status(401).json({ success: false, message: 'Invalid token' }); }
  const dev = await Developer.findById(payload.devId);
  if (!dev) return res.status(404).json({ success: false, message: 'Developer not found' });
  const incoming = String(req.body.apiKey || '');
  const parts = incoming.split('_');
  const prefix = parts.length >= 2 ? `${parts[0]}_${parts[1]}` : incoming;
  if (Array.isArray(dev.apiKeys)) {
    for (const k of dev.apiKeys) {
      if (k.prefix === prefix && k.status === 'active') {
        k.status = 'rotated'; k.rotatedAt = new Date();
      }
    }
  }
  if (dev.apiKeyPrefix === prefix) {
    dev.apiKeyPrefix = null; dev.apiKeyHash = null;
  }
  const newPrefix = `ak_${Math.random().toString(36).slice(2, 10)}`;
  const newSecret = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  const salt = await bcrypt.genSalt(10);
  const newHash = await bcrypt.hash(newSecret, salt);
  dev.apiKeyPrefix = newPrefix; dev.apiKeyHash = newHash;
  dev.apiKeys = [{ prefix: newPrefix, hash: newHash, status: 'active', createdAt: new Date() }, ...(Array.isArray(dev.apiKeys) ? dev.apiKeys : [])];
  await dev.save();
  res.status(201).json({ success: true, data: { apiKey: `${newPrefix}_${newSecret}` } });
}));

router.get('/rate-limit/status', asyncHandler(async (req, res) => {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Missing token' });
  const token = auth.slice(7);
  let payload; try { payload = jwt.verify(token, process.env.JWT_SECRET); } catch { return res.status(401).json({ success: false, message: 'Invalid token' }); }
  const dev = await Developer.findById(payload.devId);
  if (!dev) return res.status(404).json({ success: false, message: 'Developer not found' });
  const minuteBucket = Math.floor(Date.now() / 60000);
  const key = `api_rate:${dev.id}:${minuteBucket}`;
  let used = 0;
  try {
    const v = await cacheService.get(key);
    used = typeof v === 'number' ? v : (typeof v === 'string' ? parseInt(v, 10) || 0 : 0);
  } catch {}
  const plan = dev.plan || 'free';
  const LIMITS = { free: 60, startup: 300, enterprise: 1000 };
  const limit = LIMITS[plan] || LIMITS.free;
  const resetsAt = new Date((minuteBucket + 1) * 60000).toISOString();
  res.status(200).json({ success: true, data: { rateLimit: { plan, used, limit, resetsAt } } });
}));

router.get('/analytics/usage', asyncHandler(async (req, res) => {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Missing token' });
  const token = auth.slice(7);
  let payload; try { payload = jwt.verify(token, process.env.JWT_SECRET); } catch { return res.status(401).json({ success: false, message: 'Invalid token' }); }
  const dev = await Developer.findById(payload.devId);
  if (!dev) return res.status(404).json({ success: false, message: 'Developer not found' });
  const counters = dev.usageCounters || { hedera: 0, xrp: 0, algorand: 0 };
  res.status(200).json({ success: true, data: { usage: counters } });
}));

module.exports = router;
/**
 * @swagger
 * /api/v1/developers/register:
 *   post:
 *     summary: Registro de desarrolladores
 *     tags: [Developers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *               plan:
 *                 type: string
 *                 enum: [free, startup, enterprise]
*     responses:
*       201:
*         description: Registro creado
*         content:
*           application/json:
*             examples:
*               created:
*                 value:
*                   success: true
*                   data:
*                     verificationToken: "verify_abc123"
 */
/**
 * @swagger
 * /api/v1/developers/login:
 *   post:
 *     summary: Login de desarrolladores
 *     tags: [Developers]
*     responses:
*       200:
*         description: JWT emitido
*         content:
*           application/json:
*             examples:
*               ok:
*                 value:
*                   success: true
*                   data:
*                     token: "jwt_token"
 */
/**
 * @swagger
 * /api/v1/developers/api-keys/issue:
 *   post:
 *     summary: Emisión de API Key
 *     tags: [Developers]
 *     security:
 *       - bearerAuth: []
*     responses:
*       201:
*         description: API Key emitida
*         content:
*           application/json:
*             examples:
*               created:
*                 value:
*                   success: true
*                   data:
*                     apiKey: "ak_prefix_secret"
 */
