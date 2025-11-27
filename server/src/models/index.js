const User = require('./User');
const Token = require('./Token');
const Transaction = require('./Transaction');
const Partner = require('./Partner');
const Developer = require('./Developer');
const Credential = require('./Credential');
const Booking = require('./Booking');

const db = {
  User,
  Token,
  Transaction,
  Partner,
  Developer,
  Credential,
  Booking,
};

module.exports = db;
