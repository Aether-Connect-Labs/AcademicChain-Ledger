const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  universityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  credentialData: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  paymentTransactionId: {
    type: DataTypes.STRING,
  },
  issuanceTransactionId: {
    type: DataTypes.STRING,
  },
  errorDetails: {
    type: DataTypes.JSON,
  },
});

module.exports = Transaction;
