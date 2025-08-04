const sequelize = require('../config/database');
const User = require('./User');
const Token = require('./Token');
const Transaction = require('./Transaction');

const db = {
  sequelize,
  Sequelize: require('sequelize'),
  User,
  Token,
  Transaction,
};

User.hasMany(Token, { foreignKey: 'universityId' });
Token.belongsTo(User, { foreignKey: 'universityId' });

User.hasMany(Transaction, { foreignKey: 'universityId' });
Transaction.belongsTo(User, { foreignKey: 'universityId' });

module.exports = db;