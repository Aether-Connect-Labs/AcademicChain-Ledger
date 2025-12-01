const mongoose = require('mongoose');

const CredentialSchema = new mongoose.Schema({
  tokenId: { type: String, required: true, index: true },
  serialNumber: { type: String, required: true, index: true },
  universityId: { type: String, index: true },
  studentAccountId: { type: String },
  uniqueHash: { type: String, required: true, unique: true, index: true },
  ipfsURI: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Credential', CredentialSchema);
