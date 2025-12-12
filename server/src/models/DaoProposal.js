const mongoose = require('mongoose');

const DaoProposalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scope: { type: String, enum: ['global', 'region', 'institution'], default: 'global' },
  region: { type: String },
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
  options: [{ key: String, label: String }],
  startAt: { type: Date, default: () => new Date() },
  endAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('DaoProposal', DaoProposalSchema);
