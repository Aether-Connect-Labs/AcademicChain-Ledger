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
const partnerService = require('../services/partnerService');

const router = express.Router();

// Todas las rutas en este archivo están protegidas y son solo para administradores
router.use(protect, authorize(ROLES.ADMIN));

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

router.get('/xrp/status', asyncHandler(async (req, res) => {
  try { await xrpService.connect(); } catch {}
  const enabled = typeof xrpService.isEnabled === 'function' ? xrpService.isEnabled() : false;
  res.status(200).json({ success: true, data: { enabled, network: xrpService.network || 'disabled' } });
}));

router.get('/xrp/balance', asyncHandler(async (req, res) => {
  try { await xrpService.connect(); } catch {}
  const data = await xrpService.getBalance();
  res.status(200).json({ success: true, data });
}));

router.get('/institutions/stats', asyncHandler(async (req, res) => {
  try {
    const disableMongo = process.env.DISABLE_MONGO === '1';
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
    res.status(500).json({ success: false, error: 'Error fetching statistics' });
  }
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

module.exports = router;
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
