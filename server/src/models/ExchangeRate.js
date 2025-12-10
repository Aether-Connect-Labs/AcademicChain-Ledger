const mongoose = require('mongoose');

const ExchangeRateSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true, index: true },
  rate: { type: Number, required: true },
  sources: [{ type: String }],
  volatility: { type: Number },
  confidence: { type: Number },
  cacheStatus: { type: String },
}, { timestamps: true });

ExchangeRateSchema.index({ timestamp: -1 });

ExchangeRateSchema.statics.recent = function(hours = 24) {
  const since = new Date(Date.now() - (Math.max(1, parseInt(hours, 10) || 24) * 60 * 60 * 1000));
  return this.find({ timestamp: { $gte: since } }).sort({ timestamp: -1 });
};

ExchangeRateSchema.statics.stats = async function(hours = 24) {
  const since = new Date(Date.now() - (Math.max(1, parseInt(hours, 10) || 24) * 60 * 60 * 1000));
  const pipeline = [
    { $match: { timestamp: { $gte: since } } },
    { $group: { _id: null, avgRate: { $avg: "$rate" }, minRate: { $min: "$rate" }, maxRate: { $max: "$rate" }, count: { $sum: 1 } } }
  ];
  const [r] = await this.aggregate(pipeline);
  return r || { avgRate: null, minRate: null, maxRate: null, count: 0 };
};

module.exports = mongoose.model('ExchangeRate', ExchangeRateSchema);
