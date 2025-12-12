const router = require('express').Router();
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/auth');
const ROLES = require('../config/roles');
const dao = require('../services/daoService');

router.post('/proposals', protect, authorize(ROLES.UNIVERSITY, ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { title, description, scope, region, institutionId, options, endAt } = req.body;
  const doc = await dao.createProposal({ title, description, createdBy: req.user.id, scope, region, institutionId, options, endAt });
  res.status(201).json({ success: true, data: { proposal: doc } });
}));

router.get('/proposals', protect, asyncHandler(async (req, res) => {
  const list = await dao.listProposals({ scope: req.query.scope, region: req.query.region, institutionId: req.query.institutionId, status: req.query.status, limit: req.query.limit });
  res.status(200).json({ success: true, data: { proposals: list } });
}));

router.post('/votes', protect, asyncHandler(async (req, res) => {
  const { proposalId, optionKey, weight } = req.body;
  const vote = await dao.voteOnProposal({ proposalId, voterId: req.user.id, optionKey, weight });
  res.status(201).json({ success: true, data: { vote } });
}));

router.get('/proposals/:id/tally', protect, asyncHandler(async (req, res) => {
  const tally = await dao.tallyProposal(req.params.id);
  res.status(200).json({ success: true, data: { tally } });
}));

module.exports = router;
