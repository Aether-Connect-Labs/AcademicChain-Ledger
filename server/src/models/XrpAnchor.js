const mongoose = require('mongoose');

const XrpAnchorSchema = new mongoose.Schema({
  certificateHash: { type: String, required: true, index: true },
  hederaTokenId: { type: String },
  serialNumber: { type: String },
  hederaTopicId: { type: String },
  hederaSequence: { type: Number },
  timestamp: { type: Date, required: true },
  xrpTxHash: { type: String },
  network: { type: String, default: 'disabled' },
  status: { type: String, default: 'mock', index: true },
}, { timestamps: true });

module.exports = mongoose.model('XrpAnchor', XrpAnchorSchema);
