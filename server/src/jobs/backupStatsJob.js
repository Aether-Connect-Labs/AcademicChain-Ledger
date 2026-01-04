const cron = require('node-cron');
const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');

async function computeStats() {
  try {
    const { Credential } = require('../models');
    const total = await Credential.countDocuments();
    const pipeline = [
      { $lookup: { from: 'xrpanchors', localField: 'uniqueHash', foreignField: 'certificateHash', as: 'xrp' } },
      { $lookup: { from: 'algorandanchors', localField: 'uniqueHash', foreignField: 'certificateHash', as: 'algo' } },
      { $project: { hasXrp: { $gt: [{ $size: '$xrp' }, 0] }, hasAlgo: { $gt: [{ $size: '$algo' }, 0] } } },
      { $match: { hasXrp: true, hasAlgo: true } },
      { $count: 'count' }
    ];
    const r = await Credential.aggregate(pipeline);
    const tripleBacked = (r[0]?.count || 0);
    const hederaOnly = Math.max(0, total - tripleBacked);
    return { totalCredentials: total, tripleBacked, hederaOnly };
  } catch (e) {
    logger.warn('backup-stats compute error', { message: e.message });
    return { totalCredentials: 0, tripleBacked: 0, hederaOnly: 0 };
  }
}

async function refreshCache() {
  const data = await computeStats();
  const payload = { success: true, data };
  try {
    await cacheService.set('http:/api/admin/backup-stats', payload, 300);
    await cacheService.set('backup_stats', data, 300);
    logger.info('backup-stats cache refreshed', { total: data.totalCredentials, tripleBacked: data.tripleBacked });
  } catch (e) {
    logger.warn('backup-stats cache set failed', { message: e.message });
  }
}

function startBackupStatsJob() {
  try {
    refreshCache().catch(() => {});
    const task = cron.schedule('*/5 * * * *', () => { refreshCache().catch(() => {}); });
    const stopTask = (sig) => { try { task.stop(); } catch {} };
    process.on('SIGINT', stopTask);
    process.on('SIGTERM', stopTask);
  } catch (e) {
    logger.warn('backup-stats job start failed', { message: e.message });
  }
}

module.exports = { startBackupStatsJob };

