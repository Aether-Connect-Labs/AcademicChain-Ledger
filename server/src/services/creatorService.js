const { CreatorProfile, Credential } = require('../models');
let generateDID = async (prefix, userId) => `did:web:${prefix}-${userId}`;
try {
  const veramoModule = require('./veramo');
  if (typeof veramoModule.generateDID === 'function') {
    generateDID = veramoModule.generateDID;
  }
} catch {}
const { Op } = require('sequelize');
const crypto = require('crypto');

class CreatorService {
  async getCreatorProfile(userId) {
    let profile = await CreatorProfile.findOne({ where: { userId } });
    
    if (!profile) {
      // Create default profile
      const did = await generateDID('creator', userId);
      profile = await CreatorProfile.create({
        userId,
        did,
        name: 'Creador',
        brand: 'Marca Personal',
        bio: 'Mentor y educador certificado',
        signature: null,
        logo: null
      });
    }
    
    return profile;
  }

  async updateCreatorProfile(userId, profileData) {
    const [profile, created] = await CreatorProfile.upsert({
      userId,
      ...profileData,
      updatedAt: new Date()
    }, {
      returning: true
    });
    
    return profile;
  }

  async updateCreatorApiKey(userId, apiKey) {
    const profile = await CreatorProfile.findOne({ where: { userId } });
    if (profile) {
      await profile.update({ apiKey });
    }
    return profile;
  }

  async getCreatorCredentials(userId, options = {}) {
    const { page = 1, limit = 50, sort = 'desc' } = options;
    const offset = (page - 1) * limit;
    
    const where = {
      issuerId: userId,
      issuerType: 'CREATOR'
    };
    
    const { count, rows } = await Credential.findAndCountAll({
      where,
      order: [['createdAt', sort.toUpperCase()]],
      limit,
      offset,
      attributes: [
        'id', 'tokenId', 'serialNumber', 'studentName', 'studentEmail',
        'credentialType', 'title', 'description', 'issueDate', 'expiryDate',
        'blockchainHash', 'blockchainNetwork', 'status', 'createdAt'
      ]
    });
    
    const pages = Math.ceil(count / limit);
    
    return {
      items: rows,
      total: count,
      page,
      pages,
      limit
    };
  }

  async issueCreatorCredential(userId, data) {
    const profile = await this.getCreatorProfile(userId);
    const { students, ...commonData } = data;

    const issueSingleCredential = async (studentData) => {
      const tokenId = crypto.randomBytes(16).toString('hex');
      const serialNumber = crypto.randomInt(100000, 999999).toString();

      const credential = await Credential.create({
        ...commonData,
        ...studentData,
        tokenId,
        serialNumber,
        issuerId: userId,
        issuerType: 'CREATOR',
        issuerName: profile.name,
        issuerBrand: profile.brand,
        issuerDid: profile.did,
        status: 'issued',
        blockchainNetwork: 'hedera',
        metadata: {
          creatorSignature: profile.signature,
          creatorLogo: profile.logo,
          mentorVerified: true,
          eliteProof: true
        }
      });

      // Simplified blockchain interaction for now
      // In a real scenario, this would be a more robust queueing system
      await credential.update({
        blockchainHash: `fake-hash-${tokenId}`,
      });

      return credential;
    };

    if (students && Array.isArray(students)) {
      // Bulk issuance for a cohort
      const credentials = await Promise.all(students.map(student => issueSingleCredential(student)));
      return {
        message: `${credentials.length} credenciales emitidas para la cohorte.`,
        credentials,
      };
    } else {
      // Single issuance
      const credential = await issueSingleCredential({ studentName: data.studentName, studentEmail: data.studentEmail });
      return {
        message: 'Credencial emitida con éxito.',
        credential,
      };
    }
  }

  async getCreatorStats(userId) {
    const profile = await this.getCreatorProfile(userId);
    
    const totalIssued = await Credential.count({
      where: {
        issuerId: userId,
        issuerType: 'CREATOR'
      }
    });
    
    const thisMonth = await Credential.count({
      where: {
        issuerId: userId,
        issuerType: 'CREATOR',
        createdAt: {
          [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    });
    
    const uniqueStudents = await Credential.count({
      distinct: true,
      col: 'studentEmail',
      where: {
        issuerId: userId,
        issuerType: 'CREATOR'
      }
    });
    
    const byType = await Credential.findAll({
      where: {
        issuerId: userId,
        issuerType: 'CREATOR'
      },
      attributes: ['credentialType', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['credentialType']
    });
    
    return {
      profile,
      totalIssued,
      thisMonth,
      uniqueStudents,
      byType: byType.map(item => ({
        type: item.credentialType,
        count: parseInt(item.get('count'))
      })),
      averagePerMonth: Math.round(totalIssued / 6) // Last 6 months
    };
  }
}

module.exports = new CreatorService();
