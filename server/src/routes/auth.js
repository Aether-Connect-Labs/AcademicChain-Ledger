const express = require('express');
const { body } = require('express-validator');
const asyncHandler = require('express-async-handler');
const authService = require('../services/authService');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const passport = require('passport');

const router = express.Router();

router.post('/register', 
  [
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().withMessage('Name is required').trim().escape(),
    body('role').isIn(['university', 'admin']).withMessage('Invalid role'),
    body('universityName').if(body('role').equals('university')).notEmpty().withMessage('University name is required for university role').trim().escape(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    await authService.register(req.body, res);
    res.status(201).json({ "success": true, "message": 'User registered and logged in successfully' });
  })
);

router.post('/login', 
  [
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    await authService.login(req.body, res);
    res.status(200).json({ "success": true, "message": 'Logged in successfully' });
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
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({ success: false, message: 'Google OAuth no está configurado' });
  }
  const defaultClient = (process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',')[0] : 'http://localhost:5173');
  const state = req.query.redirect_uri || defaultClient;
  passport.authenticate('google', { scope: ['profile', 'email'], state })(req, res, next);
});

router.get('/google/callback',
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
