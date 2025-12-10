const logger = require('../utils/logger');

const audit = (action) => {
  return (req, res, next) => {
    try {
      const userId = req.user?.id || req.user?._id || 'unknown';
      const payload = { ...req.body };
      if (payload.rate && typeof payload.rate === 'number') {
        payload.rate = Number(payload.rate);
      }
      logger.info(`AUDIT ${action}`, { userId, payload, ip: req.ip, at: new Date().toISOString() });
    } catch {}
    next();
  };
};

module.exports = { audit };
