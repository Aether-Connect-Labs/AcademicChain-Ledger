const mongoose = require('mongoose');

const DaoVoteSchema = new mongoose.Schema({
  proposalId: { type: mongoose.Schema.Types.ObjectId, ref: 'DaoProposal', required: true, index: true },
  voterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  optionKey: { type: String, required: true },
  weight: { type: Number, default: 1 },
}, { timestamps: true });

DaoVoteSchema.index({ proposalId: 1, voterId: 1 }, { unique: true });

module.exports = mongoose.model('DaoVote', DaoVoteSchema);
