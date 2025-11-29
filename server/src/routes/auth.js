const express = require('express');
const { body } = require('express-validator');
const asyncHandler = require('express-async-handler');
const authService = require('../services/authService');
const { protect, authorize } = require('../middleware/auth');
const ROLES = require('../config/roles');
const { validate } = require('../middleware/validator');
const passport = require('passport');

const router = express.Router();

// Public registration: students only
router.post('/register', 
  [
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').optional().isString().trim().escape(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const payload = { ...req.body, role: 'student', universityName: null };
    const { token, user } = await authService.register(payload);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });
    res.status(201).json({ success: true, token, user });
  })
);

// Admin-only route to create institution accounts
router.post('/institutions/register',
  protect,
  authorize(ROLES.ADMIN),
  [
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').notEmpty().withMessage('Name is required').trim().escape(),
    body('universityName').notEmpty().withMessage('University name is required').trim().escape(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const payload = { ...req.body, role: 'university' };
    const { token, user } = await authService.register(payload);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });
    res.status(201).json({ success: true, token, user });
  })
);

router.post('/login', 
  [
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { token, user } = await authService.login(req.body, res);
    res.status(200).json({ success: true, token, user });
  })
);

router.get('/me',
  protect,
  asyncHandler(async (req, res) => {
    const userProfile = authService.getUserProfile(req.user);
    res.status(200).json({ "success": true, "data": userProfile });
  })
);

router.patch('/me',
  protect,
  [
    body('name').optional().isString().trim().escape(),
    body('hederaAccountId').optional().isString().trim().escape(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, hederaAccountId } = req.body;
    const { User } = require('../models');
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (typeof name === 'string') user.name = name;
    if (typeof hederaAccountId === 'string') user.hederaAccountId = hederaAccountId;
    await user.save();
    const userProfile = authService.getUserProfile(user);
    res.status(200).json({ success: true, data: userProfile });
  })
);

router.get('/google', (req, res, next) => {
  const defaultClient = (process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',')[0] : 'http://localhost:5173');
  const redirectUri = req.query.redirect_uri || defaultClient;
  const hasGoogle = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
  const isProd = process.env.NODE_ENV === 'production';
  if (!hasGoogle && !isProd) {
    const authService = require('../services/authService');
    const user = { id: 'dev-admin', email: 'admin.dev@academicchain.com', name: 'Admin Dev', role: 'admin', isActive: true };
    const token = authService.generateToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });
    const url = `${redirectUri}?token=${encodeURIComponent(token)}&provider=google`;
    return res.redirect(url);
  }
  if (!hasGoogle && isProd) {
    return res.status(503).json({ success: false, message: 'Google OAuth no está configurado' });
  }
  const state = redirectUri;
  passport.authenticate('google', { scope: ['profile', 'email'], state })(req, res, next);
});

// Endpoint para comprobar si Google OAuth está habilitado
router.get('/google/enabled', (req, res) => {
  const hasGoogle = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const enabled = hasGoogle || (process.env.NODE_ENV !== 'production');
  res.status(200).json({ success: true, enabled });
});

router.post('/google/mock', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Mock OAuth no permitido en producción' });
  }
  const authService = require('../services/authService');
  const user = { id: 'dev-admin', email: 'admin.dev@academicchain.com', name: 'Admin Dev', role: 'admin', isActive: true };
  const token = authService.generateToken(user);
  res.status(200).json({ success: true, token, user });
});

// Preview owner login (development only)
router.post('/preview-login', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'No permitido en producción' });
  }
  const { email, password } = req.body || {};
  const ownerEmail = process.env.PREVIEW_OWNER_EMAIL;
  const ownerPassword = process.env.PREVIEW_OWNER_PASSWORD;
  if (email === ownerEmail && password === ownerPassword) {
    const token = authService.generateToken({ id: 'preview-owner', email, name: 'Owner', role: 'admin', isActive: true });
    return res.status(200).json({ success: true, token });
  }
  return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
});

router.get('/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    const redirect = (process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',')[0] : 'http://localhost:5173');
    return res.redirect(`${redirect}/login?error=google_not_configured`);
  }
  next();
},
  passport.authenticate('google', { session: false, failureRedirect: (process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',')[0] : 'http://localhost:5173') + '/login?error=google' }),
  asyncHandler(async (req, res) => {
    const redirect = req.query.state || (process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',')[0] : 'http://localhost:5173');
    const token = authService.generateToken(req.user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });
    const url = `${redirect}/auth/callback?token=${encodeURIComponent(token)}&provider=google`;
    res.redirect(url);
  })
);

module.exports = router;
