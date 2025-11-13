const User = require('./User');
const Token = require('./Token');
const Transaction = require('./Transaction');
const Partner = require('./Partner');

const db = {
  User,
  Token,
  Transaction,
  Partner,
};

module.exports = db;