const { SystemMetrics } = require('../models');
const { isConnected: isMongoConnected, getConnectionStats } = require('../config/database');
const { isConnected: isRedisConnected } = require('../../queue/connection');

class MonitoringService {
  async snapshot() {
    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();
    const doc = await SystemMetrics.create({
      timestamp: new Date(),
      uptime: process.uptime(),
      memory: { rss: mem.rss, heapTotal: mem.heapTotal, heapUsed: mem.heapUsed },
      cpu: { user: cpu.user, system: cpu.system },
      pid: process.pid,
      nodeVersion: process.version,
      mongoConnected: isMongoConnected(),
      redisConnected: isRedisConnected(),
      xrplEnabled: false
    });
    return doc;
  }
  async list(limit = 50) {
    const lim = Math.max(1, Math.min(parseInt(limit, 10) || 50, 200));
    return SystemMetrics.find({}).sort({ createdAt: -1 }).limit(lim);
  }
}

module.exports = new MonitoringService();