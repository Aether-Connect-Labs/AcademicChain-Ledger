const router = require('express').Router();
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/auth');
const ROLES = require('../config/roles');
const { TimeoutManager, TIMEOUT_DEFAULTS } = require('../utils/timeoutConfig');
const { ERROR_CODES } = require('../utils/errorCodes');

router.get('/timeouts', protect, authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const services = Object.keys(TIMEOUT_DEFAULTS.development);
  const values = {};
  for (const s of services) { values[s] = TimeoutManager.getTimeout(s); }
  res.status(200).json({ success: true, data: { env: process.env.NODE_ENV || 'development', timeouts: values } });
}));

router.get('/error-codes', protect, authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: ERROR_CODES });
}));

module.exports = router;
