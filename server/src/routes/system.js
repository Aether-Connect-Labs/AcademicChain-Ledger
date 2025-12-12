const router = require('express').Router();
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/auth');
const ROLES = require('../config/roles');
const { TimeoutManager, TIMEOUT_DEFAULTS } = require('../utils/timeoutConfig');
const { ERROR_CODES } = require('../utils/errorCodes');
const { Credential } = require('../models');
const xrpService = require('../services/xrpService');
const algorandService = require('../services/algorandService');

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

router.post('/migration/progressive', protect, authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const dry = String(req.body.dryRun || req.query.dryRun || '1') !== '0';
  const batchSize = Math.max(1, Math.min(200, parseInt(req.body.batchSize || req.query.batchSize || '50', 10)));
  const delayMs = Math.max(0, parseInt(req.body.delayMs || req.query.delayMs || '1000', 10));
  const target = String(req.body.target || req.query.target || 'xrpl,algorand').toLowerCase().split(',').map(s => s.trim());
  const creds = await Credential.find({}).select('tokenId serialNumber uniqueHash').lean();
  let processed = 0;
  for (let i = 0; i < creds.length; i += batchSize) {
    const batch = creds.slice(i, i + batchSize);
    if (!dry) {
      const tasks = [];
      if (target.includes('xrpl')) { await xrpService.connect(); tasks.push(...batch.map(c => xrpService.anchor({ certificateHash: c.uniqueHash, hederaTokenId: c.tokenId, serialNumber: c.serialNumber, timestamp: new Date().toISOString() }))); }
      if (target.includes('algorand')) { await algorandService.connect(); tasks.push(...batch.map(c => algorandService.anchor({ certificateHash: c.uniqueHash, hederaTokenId: c.tokenId, serialNumber: c.serialNumber, timestamp: new Date().toISOString() }))); }
      await Promise.all(tasks);
    }
    processed += batch.length;
    if (delayMs > 0) { await new Promise(r => setTimeout(r, delayMs)); }
  }
  res.status(202).json({ success: true, data: { total: creds.length, processed, dryRun: dry, targets: target } });
}));
