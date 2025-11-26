const cacheService = require('../services/cacheService');
const { UnauthorizedError } = require('../utils/errors');

const LIMITS = { free: 60, startup: 300, enterprise: 1000 };

module.exports = async function apiRateLimit(req, res, next) {
  const consumer = req.apiConsumer;
  if (!consumer) return next(new UnauthorizedError('Missing consumer for rate limit'));
  const plan = consumer.plan || 'free';
  const limit = LIMITS[plan] || LIMITS.free;
  const minuteBucket = Math.floor(Date.now() / 60000);
  const key = `api_rate:${consumer.id}:${minuteBucket}`;
  try {
    const count = await cacheService.increment(key, 1);
    await cacheService.expire?.(key, 60);
    if (count !== null && count > limit) {
      res.status(429).json({ success: false, message: 'Rate limit exceeded', data: { plan, limit } });
      return;
    }
  } catch {}
  next();
}