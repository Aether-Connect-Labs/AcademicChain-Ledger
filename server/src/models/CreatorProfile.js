module.exports = (sequelize, DataTypes) => {
  const CreatorProfile = sequelize.define('CreatorProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  did: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Creador'
  },
  brand: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Marca Personal'
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  website: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  signature: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  logo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  apiKey: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  totalIssued: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalStudents: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'creator_profiles',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId']
    },
    {
      unique: true,
      fields: ['did']
    },
    {
      unique: true,
      fields: ['apiKey']
    }
  ]
});

return CreatorProfile;
};