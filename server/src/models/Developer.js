const mongoose = require('mongoose');

const DeveloperSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  name: { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true },
  plan: { type: String, enum: ['free', 'startup', 'enterprise'], default: 'free', index: true },
  apiKeyPrefix: { type: String, unique: true, sparse: true, index: true },
  apiKeyHash: { type: String },
  emailVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  isActive: { type: Boolean, default: true },
  apiKeys: [{
    prefix: { type: String, index: true },
    hash: { type: String },
    status: { type: String, enum: ['active', 'rotated', 'revoked'], default: 'active' },
    createdAt: { type: Date, default: Date.now },
    lastUsedAt: { type: Date },
    rotatedAt: { type: Date },
    revokedAt: { type: Date }
  }],
  usageCounters: {
    hedera: { type: Number, default: 0 },
    xrp: { type: Number, default: 0 },
    algorand: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Developer', DeveloperSchema);
