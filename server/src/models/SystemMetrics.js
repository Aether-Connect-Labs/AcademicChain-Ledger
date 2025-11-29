const mongoose = require('mongoose');

const SystemMetricsSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true, index: true },
  uptime: { type: Number, required: true },
  memory: {
    rss: { type: Number },
    heapTotal: { type: Number },
    heapUsed: { type: Number }
  },
  cpu: {
    user: { type: Number },
    system: { type: Number }
  },
  pid: { type: Number },
  nodeVersion: { type: String },
  mongoConnected: { type: Boolean },
  redisConnected: { type: Boolean },
  xrplEnabled: { type: Boolean }
}, { timestamps: true });

module.exports = mongoose.model('SystemMetrics', SystemMetricsSchema);