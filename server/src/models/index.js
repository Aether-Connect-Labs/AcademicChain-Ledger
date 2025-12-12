const User = require('./User');
const Token = require('./Token');
const Transaction = require('./Transaction');
const Partner = require('./Partner');
const Developer = require('./Developer');
const Credential = require('./Credential');
const Booking = require('./Booking');
const XrpAnchor = require('./XrpAnchor');
const AlgorandAnchor = require('./AlgorandAnchor');
const SystemMetrics = require('./SystemMetrics');
const ExchangeRate = require('./ExchangeRate');
const AnalyticsEvent = require('./AnalyticsEvent');
const DaoProposal = require('./DaoProposal');
const DaoVote = require('./DaoVote');

const db = {
  User,
  Token,
  Transaction,
  Partner,
  Developer,
  Credential,
  Booking,
  XrpAnchor,
  AlgorandAnchor,
  SystemMetrics,
  ExchangeRate,
  AnalyticsEvent,
  DaoProposal,
  DaoVote,
};

module.exports = db;
