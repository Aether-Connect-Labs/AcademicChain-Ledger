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