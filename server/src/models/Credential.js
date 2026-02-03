const mongoose = require('mongoose');

const CredentialSchema = new mongoose.Schema({
  tokenId: { type: String, required: true, index: true },
  serialNumber: { type: String, required: true, index: true },
  universityId: { type: String, index: true },
  studentAccountId: { type: String },
  uniqueHash: { type: String, required: true, unique: true, index: true },
  ipfsURI: { type: String, required: true },
  ipfsMetadataCid: { type: String, index: true },
  ipfsPdfCid: { type: String, index: true },
  storageDeal: { type: mongoose.Schema.Types.Mixed }, // Información del deal de Filecoin
  storageProtocol: { type: String, default: 'IPFS' }, // 'IPFS' o 'IPFS+Filecoin'
  vcJwt: { type: String, default: null }, // W3C Verifiable Credential JWT
  statusListIndex: { type: Number, index: true }, // Global index for Bitstring Status List
  socialShares: {
    linkedin: { type: Number, default: 0 },
    twitter: { type: Number, default: 0 },
    facebook: { type: Number, default: 0 },
    copyLink: { type: Number, default: 0 }
  },
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
  encryption: {
    isEncrypted: { type: Boolean, default: false },
    key: { type: String }, // The file-specific decryption key (encrypted with MasterKey ideally, or plain for MVP if MasterKey wraps it)
    algo: { type: String, default: 'aes-256-gcm' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Credential', CredentialSchema);
