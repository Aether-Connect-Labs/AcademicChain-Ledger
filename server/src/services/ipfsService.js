const pinataSDK = require('@pinata/sdk');
const { logger } = require('../utils/logger');
const { ServiceUnavailableError } = require('../utils/errors');

class IpfsService {
  constructor() {
    if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_API_KEY) {
      logger.warn('Pinata API keys not found in .env. IPFS functionality will be disabled.');
      this.pinata = null;
    } else {
      this.pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_API_KEY);
    }
  }

  async testConnection() {
    if (!this.pinata) return; // No fallar si no está configurado, solo advertir.
    try {
      await this.pinata.testAuthentication();
      logger.info('✅ Successfully connected to Pinata IPFS');
    } catch (error) {
      logger.error('❌ Failed to connect to Pinata IPFS. Check your API keys.', error.message);
      // No lanzamos un error para no detener el servidor, pero la funcionalidad de IPFS no estará disponible.
    }
  }

  async pinJson(jsonData, name) {
    if (!this.pinata) throw new ServiceUnavailableError('IPFS service is not configured.');
    try {
      const options = {
        pinataMetadata: { name: name || `AcademicChain-Credential-${new Date().toISOString()}` },
        pinataOptions: { cidVersion: 0 },
      };
      const result = await this.pinata.pinJSONToIPFS(jsonData, options);
      logger.info(`📌 JSON pinned to IPFS with CID: ${result.IpfsHash}`);
      return result;
    } catch (error) {
      logger.error('❌ Error pinning JSON to IPFS:', error);
      throw new ServiceUnavailableError('Failed to pin JSON to IPFS.');
    }
  }
}

module.exports = new IpfsService();