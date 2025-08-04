const mongoose = require('mongoose');

const PartnerSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  keyPrefix: { type: String, required: true, unique: true, index: true },
  keyHash: { type: String, required: true },
  allowedDomains: [String], // Para seguridad CORS
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Partner', PartnerSchema);