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
}, { timestamps: true });

module.exports = mongoose.model('Developer', DeveloperSchema);