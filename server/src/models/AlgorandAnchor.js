const mongoose = require('mongoose');

const AlgorandAnchorSchema = new mongoose.Schema({
  certificateHash: { type: String, required: true, index: true },
  hederaTokenId: { type: String },
  serialNumber: { type: String },
  timestamp: { type: Date, required: true },
  algoTxId: { type: String },
  network: { type: String, default: 'disabled' },
  status: { type: String, default: 'mock', index: true },
}, { timestamps: true });

module.exports = mongoose.model('AlgorandAnchor', AlgorandAnchorSchema);
