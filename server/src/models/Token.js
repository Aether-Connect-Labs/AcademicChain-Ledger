const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
  tokenId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  tokenName: {
    type: String,
    required: true,
  },
  tokenSymbol: {
    type: String,
    required: true,
  },
  universityId: {
    type: String, // Should be mongoose.Schema.Types.ObjectId ref: 'University'
    required: true,
    index: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Token', TokenSchema);