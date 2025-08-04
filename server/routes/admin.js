const express = require('express');
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/auth');
const { User } = require('../models');
const ROLES = require('../config/roles');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validator');

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