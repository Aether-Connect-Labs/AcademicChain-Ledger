const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  universityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['CREDENTIAL_ISSUANCE', 'CREDENTIAL_REVOCATION'],
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING_PAYMENT', 'PAYMENT_FAILED', 'PENDING_ISSUANCE', 'ISSUANCE_COMPLETE', 'ISSUANCE_FAILED'],
    required: true,
    default: 'PENDING_PAYMENT',
  },
  credentialData: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  paymentTransactionId: { // Hedera Tx ID for the payment
    type: String,
  },
  issuanceTransactionId: { // Hedera Tx ID for the NFT mint
    type: String,
  },
  errorDetails: {
    message: String,
    stack: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Transaction', TransactionSchema);