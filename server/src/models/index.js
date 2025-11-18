const User = require('./User');
const Token = require('./Token');
const Transaction = require('./Transaction');
const Partner = require('./Partner');
const Credential = require('./Credential');

const db = {
  User,
  Token,
  Transaction,
  Partner,
  Credential,
};

module.exports = db;