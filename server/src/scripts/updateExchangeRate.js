require('dotenv').config();
const logger = require('../utils/logger');
const rateOracle = require('../services/rateOracle');

const shutdown = (signal) => {
  try { logger.info(`Graceful shutdown on ${signal}`); } catch {}
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

(async () => {
  try {
    const r = await rateOracle.refresh();
    logger.info('Exchange rate updated', r);
    process.exit(0);
  } catch (e) {
    logger.error('Exchange rate update failed', e);
    process.exit(1);
  }
})();
