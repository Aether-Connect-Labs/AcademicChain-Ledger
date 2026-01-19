const router = require('express').Router();
const asyncHandler = require('express-async-handler');
const { body } = require('express-validator');
const { validate } = require('../../middleware/validator');
const { requireApiKey } = require('../../middleware/apiKeyAuth');
const apiRateLimit = require('../../middleware/apiRateLimit');
const planGate = require('../../middleware/planGate');
const { Developer } = require('../../models');

async function logUsage(devId, networks = {}) {
  try {
    const dev = await Developer.findById(devId);
    if (!dev) return;
    dev.usageCounters = dev.usageCounters || { hedera: 0, xrp: 0, algorand: 0 };
    if (networks.hedera) dev.usageCounters.hedera += 1;
    if (networks.xrp) dev.usageCounters.xrp += 1;
    if (networks.algorand) dev.usageCounters.algorand += 1;
    const prefix = (networks.apiKeyPrefix || '');
    if (Array.isArray(dev.apiKeys)) {
      const entry = dev.apiKeys.find(k => k.prefix === prefix);
      if (entry) entry.lastUsedAt = new Date();
    }
    await dev.save();
  } catch {}
}

router.post('/standard',
  requireApiKey(),
  apiRateLimit,
  planGate('free'),
  [
    body('tokenId').optional().isString(),
    body('serialNumber').optional().isString(),
    body('payload').optional().isObject()
  ],
  validate,
  asyncHandler(async (req, res) => {
    const meta = { HBAR: true, XRP: false, ALGO: false };
    const devId = req.apiConsumer?.id;
    await logUsage(devId, { hedera: true, apiKeyPrefix: req.apiKeyPrefix });
    res.status(200).json({ success: true, data: { message: 'Certify standard (Hedera)', networks: meta } });
  })
);

router.post('/dual',
  requireApiKey(),
  apiRateLimit,
  planGate('startup'),
  [
    body('tokenId').optional().isString(),
    body('serialNumber').optional().isString(),
    body('payload').optional().isObject()
  ],
  validate,
  asyncHandler(async (req, res) => {
    const meta = { HBAR: true, XRP: true, ALGO: false };
    const devId = req.apiConsumer?.id;
    await logUsage(devId, { hedera: true, xrp: true, apiKeyPrefix: req.apiKeyPrefix });
    res.status(200).json({ success: true, data: { message: 'Certify dual (Hedera + XRP)', networks: meta } });
  })
);

router.post('/triple',
  requireApiKey(),
  apiRateLimit,
  planGate('enterprise'),
  [
    body('tokenId').optional().isString(),
    body('serialNumber').optional().isString(),
    body('payload').optional().isObject()
  ],
  validate,
  asyncHandler(async (req, res) => {
    const meta = { HBAR: true, XRP: true, ALGO: true };
    const devId = req.apiConsumer?.id;
    await logUsage(devId, { hedera: true, xrp: true, algorand: true, apiKeyPrefix: req.apiKeyPrefix });
    res.status(200).json({ success: true, data: { message: 'Certify triple (HBAR + XRP + ALGO)', networks: meta } });
  })
);

module.exports = router;
