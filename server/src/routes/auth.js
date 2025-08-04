const express = require('express');
const { body } = require('express-validator');
const asyncHandler = require('express-async-handler');
const authService = require('../services/authService');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

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

module.exports = router;
