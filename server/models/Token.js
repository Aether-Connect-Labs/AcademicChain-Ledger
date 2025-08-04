const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Token = sequelize.define('Token', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  tokenId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  tokenName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tokenSymbol: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  universityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = Token;
