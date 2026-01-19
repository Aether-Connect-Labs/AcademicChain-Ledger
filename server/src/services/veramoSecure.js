const { agent } = require('./veramo');
const apiKeyService = require('./apiKeyService');
const logger = require('../utils/logger');
const { CreatorProfile } = require('../models');

/**
 * Servicio seguro de Veramo que requiere API Key para operaciones críticas
 * Protege el agente de Veramo con autenticación y permisos
 */
class VeramoSecureService {
  constructor() {
    this.agent = agent;
  }

  /**
   * Valida que la API Key tenga los permisos necesarios
   * @param {string} apiKey - La API Key proporcionada
   * @param {string[]} requiredPermissions - Permisos requeridos
   * @returns {object} Resultado de la validación
   */
  validateApiKeyPermissions(apiKey, requiredPermissions = []) {
    if (!apiKey) {
      return { valid: false, error: 'API Key requerida' };
    }

    const validation = apiKeyService.validateApiKey(apiKey);
    if (!validation.valid) {
      return validation;
    }

    // Verificar permisos específicos si se requieren
    if (requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.some(permission => 
        apiKeyService.hasPermission(validation, permission)
      );
      
      if (!hasPermission) {
        return { 
          valid: false, 
          error: 'Permisos insuficientes para esta operación',
          required: requiredPermissions
        };
      }
    }

    return validation;
  }

  /**
   * Crea un DID de forma segura con validación de API Key
   * @param {string} apiKey - API Key para autenticación
   * @param {object} options - Opciones para crear el DID
   * @returns {Promise<object>} El DID creado
   */
  async createDIDSecure(apiKey, options = {}) {
    const validation = this.validateApiKeyPermissions(apiKey, ['did:create', 'did:manage']);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    try {
      logger.info(`🔐 Creando DID seguro - Key: ${validation.keyId}`);
      
      const did = await this.agent.didManagerCreate({
        provider: options.provider || 'did:web',
        alias: options.alias || `secure-${Date.now()}`,
        ...options
      });

      logger.info(`✅ DID creado exitosamente: ${did.did}`);
      return did;
    } catch (error) {
      logger.error('❌ Error creando DID seguro:', error);
      throw new Error('Error al crear el DID de forma segura');
    }
  }

  /**
   * Resuelve un DID de forma segura con validación de API Key
   * @param {string} apiKey - API Key para autenticación
   * @param {string} did - El DID a resolver
   * @returns {Promise<object>} El documento DID resuelto
   */
  async resolveDIDSecure(apiKey, did) {
    const validation = this.validateApiKeyPermissions(apiKey, ['did:read', 'did:manage']);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    try {
      logger.info(`🔐 Resolviendo DID seguro: ${did} - Key: ${validation.keyId}`);
      
      const resolution = await this.agent.resolveDid({ didUrl: did });
      
      logger.info(`✅ DID resuelto exitosamente: ${did}`);
      return resolution;
    } catch (error) {
      logger.error(`❌ Error resolviendo DID seguro ${did}:`, error);
      throw new Error('Error al resolver el DID de forma segura');
    }
  }

  /**
   * Emite una credencial verificable de forma segura con validación de API Key
   * @param {string} apiKey - API Key para autenticación
   * @param {object} credentialData - Datos de la credencial
   * @returns {Promise<object>} La credencial emitida
   */
  async issueCredentialSecure(apiKey, credentialData) {
    const validation = this.validateApiKeyPermissions(apiKey, ['vc:create', 'vc:issue']);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    try {
      logger.info(`🔐 Emitiendo credencial verificable - Key: ${validation.keyId}`);
      
      // Validar datos requeridos
      if (!credentialData.credentialSubject) {
        throw new Error('Datos de credencial incompletos');
      }

      // Si la API Key pertenece a un creador, enriquecer la credencial
      if (validation.role === 'CREATOR') {
        const creatorProfile = await CreatorProfile.findOne({ where: { apiKey } });
        if (creatorProfile) {
          credentialData.issuer = { id: creatorProfile.did, name: creatorProfile.name };
          credentialData.credentialSubject.mentorVerified = true;
          credentialData.credentialSubject.eliteProof = true;
          credentialData.credentialSubject.creatorBrand = creatorProfile.brand;
        }
      } else if (!credentialData.issuer) {
        throw new Error('El emisor (issuer) es requerido para credenciales no emitidas por un creador');
      }

      // Crear la credencial con formato W3C VC
      const credential = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', ...(credentialData.type || ['AcademicCredential'])],
        issuer: credentialData.issuer,
        issuanceDate: new Date().toISOString(),
        credentialSubject: credentialData.credentialSubject,
        ...credentialData
      };

      // Firmar la credencial (esto requiere acceso al agente)
      const verifiableCredential = await this.agent.createVerifiableCredential({
        credential,
        proofFormat: 'jwt',
        save: false // No guardar en almacenamiento local por ahora
      });

      logger.info(`✅ Credencial emitida exitosamente`);
      return verifiableCredential;
    } catch (error) {
      logger.error('❌ Error emitiendo credencial segura:', error);
      throw new Error('Error al emitir la credencial de forma segura');
    }
  }

  /**
   * Verifica una credencial de forma segura con validación de API Key
   * @param {string} apiKey - API Key para autenticación
   * @param {object} verifiableCredential - La credencial a verificar
   * @returns {Promise<object>} Resultado de la verificación
   */
  async verifyCredentialSecure(apiKey, verifiableCredential) {
    const validation = this.validateApiKeyPermissions(apiKey, ['vc:verify', 'vc:read']);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    try {
      logger.info(`🔐 Verificando credencial - Key: ${validation.keyId}`);
      
      const verificationResult = await this.agent.verifyCredential({
        credential: verifiableCredential
      });

      logger.info(`✅ Credencial verificada exitosamente`);
      return verificationResult;
    } catch (error) {
      logger.error('❌ Error verificando credencial segura:', error);
      throw new Error('Error al verificar la credencial de forma segura');
    }
  }

  /**
   * Obtiene información sobre las capacidades del agente
   * @param {string} apiKey - API Key para autenticación
   * @returns {object} Información sobre el agente y sus capacidades
   */
  async getAgentInfo(apiKey) {
    const validation = this.validateApiKeyPermissions(apiKey, ['agent:info']);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    try {
      // Obtener información básica del agente
      const info = {
        agent: 'Veramo',
        version: '5.0.0', // Esto debería venir del package.json
        didMethods: ['did:web'],
        credentialFormats: ['jwt'],
        features: ['DID Management', 'Verifiable Credentials', 'Key Management'],
        status: 'active'
      };

      return info;
    } catch (error) {
      logger.error('❌ Error obteniendo información del agente:', error);
      throw new Error('Error al obtener información del agente');
    }
  }

  /**
   * Método auxiliar para obtener el agente base (solo para uso interno)
   * @returns {object} El agente de Veramo base
   */
  getBaseAgent() {
    return this.agent;
  }
}

// Exportar una instancia única del servicio
module.exports = new VeramoSecureService();