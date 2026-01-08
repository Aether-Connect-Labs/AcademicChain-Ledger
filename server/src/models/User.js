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
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
