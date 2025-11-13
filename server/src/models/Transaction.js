const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  universityId: {
    type: String, // Should be mongoose.Schema.Types.ObjectId ref: 'University'
    required: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    index: true,
  },
  credentialData: {
    type: Object,
    required: true,
  },
  paymentTransactionId: {
    type: String,
  },
  issuanceTransactionId: {
    type: String,
  },
  errorDetails: {
    type: Object,
  },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);