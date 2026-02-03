const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    default: 'user',
  },
  hederaAccountId: {
    type: String,
    index: true,
  },
  universityName: {
    type: String,
  },
  did: {
    type: String,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  credits: {
    type: Number,
    default: 0,
    index: true,
    min: 0,
  },
  plan: {
    type: String,
    enum: ['basic', 'standard', 'enterprise'],
    default: 'basic',
    index: true,
  },
  logoUrl: {
    type: String,
    default: null,
  },
  legalTermsAccepted: {
    type: Boolean,
    default: false,
  },
  dpaAccepted: {
    type: Boolean,
    default: false,
  },
  dpaSignedAt: {
    type: Date,
  },
  masterEncryptionKey: {
    type: String, // Encrypted or plain (depending on KMS strategy). For this scope, we store a generated hex string.
    select: false // Do not return by default
  },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
