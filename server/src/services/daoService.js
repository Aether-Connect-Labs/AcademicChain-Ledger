const { DaoProposal, DaoVote, User } = require('../models');
const { isConnected: isMongoConnected } = require('../config/database');
const memoryStore = require('../utils/memoryStore');
const { v4: uuidv4 } = require('uuid');

const createProposal = async ({ title, description, createdBy, scope, region, institutionId, options, endAt }) => {
  try {
    if (process.env.DISABLE_MONGO === '1' || !isMongoConnected()) {
      const doc = { 
        _id: uuidv4(), 
        id: uuidv4(),
        title, description, createdBy, scope, region, institutionId, options, endAt, 
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      memoryStore.daoProposals.push(doc);
      return doc;
    }
    const doc = await DaoProposal.create({ title, description, createdBy, scope, region, institutionId, options, endAt });
    return doc;
  } catch (e) {
    const doc = { 
      _id: uuidv4(), 
      id: uuidv4(),
      title, description, createdBy, scope, region, institutionId, options, endAt, 
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    memoryStore.daoProposals.push(doc);
    return doc;
  }
};

const voteOnProposal = async ({ proposalId, voterId, optionKey, weight }) => {
  try {
    if (process.env.DISABLE_MONGO === '1' || !isMongoConnected()) {
      const exists = memoryStore.daoProposals.find(p => String(p._id) === String(proposalId) || String(p.id) === String(proposalId));
      if (!exists || exists.status !== 'open') throw new Error('Proposal not open');
      const doc = { 
        _id: uuidv4(), 
        id: uuidv4(), 
        proposalId, voterId, optionKey, weight: Number(weight || 1), 
        createdAt: new Date().toISOString()
      };
      memoryStore.daoVotes.push(doc);
      return doc;
    }
    const proposal = await DaoProposal.findById(proposalId);
    if (!proposal || proposal.status !== 'open') throw new Error('Proposal not open');
    const doc = await DaoVote.create({ proposalId, voterId, optionKey, weight: Number(weight || 1) });
    return doc;
  } catch (e) {
    const exists = memoryStore.daoProposals.find(p => String(p._id) === String(proposalId) || String(p.id) === String(proposalId));
    if (!exists || exists.status !== 'open') throw new Error('Proposal not open');
    const doc = { 
      _id: uuidv4(), 
      id: uuidv4(), 
      proposalId, voterId, optionKey, weight: Number(weight || 1), 
      createdAt: new Date().toISOString()
    };
    memoryStore.daoVotes.push(doc);
    return doc;
  }
};

const tallyProposal = async (proposalId) => {
  try {
    if (process.env.DISABLE_MONGO === '1' || !isMongoConnected()) {
      const votes = memoryStore.daoVotes.filter(v => String(v.proposalId) === String(proposalId));
      const results = votes.reduce((acc, v) => { acc[v.optionKey] = (acc[v.optionKey] || 0) + (v.weight || 1); return acc; }, {});
      return { proposalId, results };
    }
    const votes = await DaoVote.find({ proposalId });
    const results = votes.reduce((acc, v) => { acc[v.optionKey] = (acc[v.optionKey] || 0) + (v.weight || 1); return acc; }, {});
    return { proposalId, results };
  } catch (e) {
    const votes = memoryStore.daoVotes.filter(v => String(v.proposalId) === String(proposalId));
    const results = votes.reduce((acc, v) => { acc[v.optionKey] = (acc[v.optionKey] || 0) + (v.weight || 1); return acc; }, {});
    return { proposalId, results };
  }
};

const listProposals = async ({ scope, region, institutionId, status = 'open', limit = 50 }) => {
  try {
    if (process.env.DISABLE_MONGO === '1' || !isMongoConnected()) {
      let list = memoryStore.daoProposals.slice();
      if (scope) list = list.filter(p => p.scope === scope);
      if (region) list = list.filter(p => p.region === region);
      if (institutionId) list = list.filter(p => p.institutionId === institutionId);
      if (status) list = list.filter(p => p.status === status);
      return list.slice(0, Math.min(200, Math.max(1, parseInt(limit, 10) || 50)));
    }
    const q = {};
    if (scope) q.scope = scope;
    if (region) q.region = region;
    if (institutionId) q.institutionId = institutionId;
    if (status) q.status = status;
    return DaoProposal.find(q).sort({ createdAt: -1 }).limit(Math.min(200, Math.max(1, parseInt(limit, 10) || 50)));
  } catch (e) {
    let list = memoryStore.daoProposals.slice();
    if (scope) list = list.filter(p => p.scope === scope);
    if (region) list = list.filter(p => p.region === region);
    if (institutionId) list = list.filter(p => p.institutionId === institutionId);
    if (status) list = list.filter(p => p.status === status);
    return list.slice(0, Math.min(200, Math.max(1, parseInt(limit, 10) || 50)));
  }
};

module.exports = { createProposal, voteOnProposal, tallyProposal, listProposals };
