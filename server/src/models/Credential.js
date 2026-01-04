const mongoose = require('mongoose');

const CredentialSchema = new mongoose.Schema({
  tokenId: { type: String, required: true, index: true },
  serialNumber: { type: String, required: true, index: true },
  universityId: { type: String, index: true },
  studentAccountId: { type: String },
  uniqueHash: { type: String, required: true, unique: true, index: true },
  ipfsURI: { type: String, required: true },
  status: { type: String, default: 'ACTIVE', index: true },
  revocationReason: { type: String, default: null },
  revokedAt: { type: Date, default: null },
  revocationTxId: { type: String, default: null },
  revocationTopicId: { type: String, default: null },
  revocationSequence: { type: Number, default: null },
  externalProofs: {
    xrpTxHash: { type: String },
    algoTxId: { type: String },
  },
}, { timestamps: true });

module.exports = mongoose.model('Credential', CredentialSchema);
