const crypto = require('crypto');
const logger = require('../utils/logger');
const { CreatorProfile } = require('../models');
const { Op } = require('sequelize');

class ApiKeyService {
  constructor() {
    // En producción, esto debería estar en una base de datos segura
    this.apiKeys = new Map();
    this.initializeDefaultKeys();
    this.loadCreatorApiKeys();
  }

  initializeDefaultKeys() {
    // Clave maestra del sistema (solo para desarrollo)
    const masterKey = process.env.MASTER_API_KEY || this.generateApiKey();
    if (process.env.NODE_ENV === 'development') {
      logger.info('🔑 Master API Key (development only):', masterKey);
    }
    
    this.apiKeys.set('master', {
      key: masterKey,
      name: 'Master Key',
      permissions: ['all'],
      role: 'admin',
      createdAt: new Date(),
      isActive: true
    });

    // Clave configurada por el usuario (ACADEMIC_CHAIN_API_KEY)
    if (process.env.ACADEMIC_CHAIN_API_KEY) {
      this.apiKeys.set('academic-chain-env', {
        key: process.env.ACADEMIC_CHAIN_API_KEY,
        name: 'Env Configured Key',
        permissions: ['all'],
        role: 'admin',
        createdAt: new Date(),
        isActive: true
      });
    }

    // Clave para servicios externos (portal docente, etc.)
    const externalServiceKey = process.env.EXTERNAL_SERVICE_API_KEY || this.generateApiKey();
    this.apiKeys.set('external-service', {
      key: externalServiceKey,
      name: 'External Service Key',
      permissions: ['issue-credentials', 'read-did'],
      role: 'institution',
      createdAt: new Date(),
      isActive: true
    });
  }

  async loadCreatorApiKeys() {
    try {
      if (process.env.DEMO_MODE === 'true' || process.env.DISABLE_MONGO === '1' || process.env.DISABLE_SQLITE === '1') {
        logger.info('⚠️ DEMO_MODE: Saltando carga de API Keys de creadores (SQLite).');
        return;
      }
      
      const creators = await CreatorProfile.findAll({
        where: { apiKey: { [Op.ne]: null } }
      });

      for (const creator of creators) {
        this.apiKeys.set(`creator-${creator.userId}`, {
          key: creator.apiKey,
          name: creator.name,
          permissions: ['vc:create', 'vc:issue', 'did:read'],
          role: 'CREATOR',
          userId: creator.userId,
          createdAt: creator.createdAt,
          isActive: true
        });
      }
      logger.info(`🔑 Cargadas ${creators.length} API Keys de creadores.`);
    } catch (error) {
      logger.error('❌ Error cargando API Keys de creadores:', error);
    }
  }

  generateApiKey() {
    return 'ac_' + crypto.randomBytes(32).toString('hex');
  }

  validateApiKey(providedKey) {
    if (!providedKey) {
      return { valid: false, error: 'No API key provided' };
    }

    for (const [keyId, keyData] of this.apiKeys) {
      if (keyData.key === providedKey && keyData.isActive) {
        return { 
          valid: true, 
          keyId, 
          permissions: keyData.permissions,
          name: keyData.name,
          role: keyData.role
        };
      }
    }

    return { valid: false, error: 'Invalid or inactive API key' };
  }

  hasPermission(apiKeyInfo, requiredPermission) {
    if (!apiKeyInfo.valid) return false;
    if (apiKeyInfo.permissions.includes('all')) return true;
    return apiKeyInfo.permissions.includes(requiredPermission);
  }

  getApiKeyInfo(keyId) {
    const keyData = this.apiKeys.get(keyId);
    if (!keyData) return null;
    
    return {
      id: keyId,
      name: keyData.name,
      permissions: keyData.permissions,
      role: keyData.role,
      createdAt: keyData.createdAt,
      isActive: keyData.isActive,
      // No exponemos la clave real por seguridad
      keyPreview: keyData.key.substring(0, 8) + '...'
    };
  }

  createApiKey(name, permissions = [], role = 'user') {
    const keyId = crypto.randomUUID();
    const apiKey = this.generateApiKey();
    
    this.apiKeys.set(keyId, {
      key: apiKey,
      name,
      permissions,
      role,
      createdAt: new Date(),
      isActive: true
    });

    return { keyId, apiKey };
  }

  revokeApiKey(keyId) {
    const keyData = this.apiKeys.get(keyId);
    if (keyData) {
      keyData.isActive = false;
      return true;
    }
    return false;
  }

  listApiKeys() {
    const keys = [];
    for (const [keyId, keyData] of this.apiKeys) {
      keys.push(this.getApiKeyInfo(keyId));
    }
    return keys;
  }
}

module.exports = new ApiKeyService();