const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  institutionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  action: { 
    type: String, 
    required: true, 
    enum: ['CREDENTIAL_ISSUED', 'CREDENTIAL_REVOKED', 'CREDENTIAL_UPDATED', 'AGREEMENT_SIGNED'] 
  },
  ipAddress: { type: String, default: 'unknown' },
  blockchainTxHash: { type: String, index: true },
  documentHash: { type: String, index: true }, // SHA-256 of the original PDF
  cid: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
  details: { type: mongoose.Schema.Types.Mixed } // Extra info like batch ID, etc.
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
