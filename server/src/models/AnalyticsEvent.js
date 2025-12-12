const mongoose = require('mongoose');

const AnalyticsEventSchema = new mongoose.Schema({
  type: { type: String, required: true, index: true },
  data: { type: Object, default: {} },
  timestamp: { type: Date, default: () => new Date(), index: true },
}, { timestamps: true });

module.exports = mongoose.model('AnalyticsEvent', AnalyticsEventSchema);
