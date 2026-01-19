const lighthouse = require('@lighthouse-web3/sdk');
const logger = require('../utils/logger');

/**
 * Servicio de almacenamiento persistente usando Filecoin a través de Lighthouse.
 * Proporciona redundancia y garantías de almacenamiento a largo plazo para credenciales académicas.
 */
class StorageService {
  constructor() {
    this.apiKey = process.env.LIGHTHOUSE_API_KEY;
    if (!this.apiKey) {
      logger.warn('⚠️ LIGHTHOUSE_API_KEY no configurada. El almacenamiento persistente en Filecoin no funcionará.');
    }
  }

  /**
   * Sube un buffer (archivo) a IPFS + Filecoin
   * @param {Buffer} buffer - El contenido del archivo
   * @param {string} fileName - Nombre del archivo para metadatos
   * @returns {Promise<object>} Detalles del almacenamiento (CID, URL, Deal ID)
   */
  async uploadAcademicDocument(buffer, fileName) {
    if (!this.apiKey) {
      throw new Error('LIGHTHOUSE_API_KEY requerida para almacenamiento persistente.');
    }

    try {
      logger.info(`📤 Iniciando subida persistente a Filecoin para: ${fileName}`);
      
      const response = await lighthouse.uploadBuffer(
        buffer,
        this.apiKey
      );

      logger.info(`✅ Archivo subido exitosamente a Filecoin. CID: ${response.data.Hash}`);

      return {
        cid: response.data.Hash,
        fileSize: response.data.Size,
        // Gateway público de Lighthouse, pero compatible con cualquier gateway IPFS
        persistentUrl: `https://gateway.lighthouse.storage/ipfs/${response.data.Hash}`,
        protocol: 'IPFS+Filecoin',
        provider: 'Lighthouse',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('❌ Error en Filecoin/Lighthouse upload:', error);
      throw new Error(`Fallo en la persistencia del documento: ${error.message}`);
    }
  }

  /**
   * Obtiene el estado del "Deal" de almacenamiento en Filecoin
   * @param {string} cid - El CID del archivo
   */
  async getStorageStatus(cid) {
    try {
      const status = await lighthouse.dealStatus(cid);
      return status;
    } catch (error) {
      logger.error(`Error obteniendo estado de Filecoin para ${cid}:`, error);
      return null;
    }
  }
}

module.exports = new StorageService();
