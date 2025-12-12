const { DaoProposal, DaoVote, User } = require('../models');

const createProposal = async ({ title, description, createdBy, scope, region, institutionId, options, endAt }) => {
  const doc = await DaoProposal.create({ title, description, createdBy, scope, region, institutionId, options, endAt });
  return doc;
};

const voteOnProposal = async ({ proposalId, voterId, optionKey, weight }) => {
  const proposal = await DaoProposal.findById(proposalId);
  if (!proposal || proposal.status !== 'open') throw new Error('Proposal not open');
  const doc = await DaoVote.create({ proposalId, voterId, optionKey, weight: Number(weight || 1) });
  return doc;
};

const tallyProposal = async (proposalId) => {
  const votes = await DaoVote.find({ proposalId });
  const results = votes.reduce((acc, v) => { acc[v.optionKey] = (acc[v.optionKey] || 0) + (v.weight || 1); return acc; }, {});
  return { proposalId, results };
};

const listProposals = async ({ scope, region, institutionId, status = 'open', limit = 50 }) => {
  const q = {};
  if (scope) q.scope = scope;
  if (region) q.region = region;
  if (institutionId) q.institutionId = institutionId;
  if (status) q.status = status;
  return DaoProposal.find(q).sort({ createdAt: -1 }).limit(Math.min(200, Math.max(1, parseInt(limit, 10) || 50)));
};

module.exports = { createProposal, voteOnProposal, tallyProposal, listProposals };
