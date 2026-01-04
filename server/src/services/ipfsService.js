const logger = require('../utils/logger');
const { ServiceUnavailableError } = require('../utils/errors');
const axios = require('axios');
let SecretManagerServiceClient = null;
try { SecretManagerServiceClient = require('@google-cloud/secret-manager').SecretManagerServiceClient; } catch { SecretManagerServiceClient = null; }
async function resolveSecretValue(envVal, secretEnvName) {
  const val = String(envVal || '').trim();
  if (val) return val;
  const resName = String(process.env[secretEnvName] || '').trim();
  if (!resName || !SecretManagerServiceClient) return '';
  try {
    const client = new SecretManagerServiceClient();
    const [version] = await client.accessSecretVersion({ name: resName });
    const payload = version.payload?.data?.toString('utf8') || '';
    return String(payload || '').trim();
  } catch {
    return '';
  }
}

let pinataSDK = null;
try {
  pinataSDK = require('@pinata/sdk');
} catch (error) {
  logger.warn('@pinata/sdk not installed. IPFS functionality will be disabled.');
}

class IpfsService {
  constructor() {
    if (!pinataSDK || !process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_API_KEY) {
      logger.warn('Pinata SDK or API keys not found. IPFS functionality will be disabled.');
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
      
      // Intentar replicación en Filecoin (Lighthouse o Web3.Storage)
      let filecoin = null;
      
      // 1. Lighthouse (Preferido)
      const lighthouseKey = process.env.LIGHTHOUSE_API_KEY;
      if (lighthouseKey) {
        try {
          const lighthouse = require('@lighthouse-web3/sdk');
          const uploadResponse = await lighthouse.uploadText(JSON.stringify(jsonData), lighthouseKey, name);
          const cid = uploadResponse.data.Hash;
          filecoin = { cid, provider: 'lighthouse', gateway: `https://gateway.lighthouse.storage/ipfs/${cid}` };
          logger.info(`✅ Replicado en Filecoin (Lighthouse): CID ${cid}`);
          return { ...result, filecoin };
        } catch (e) {
          logger.warn('No se pudo replicar en Lighthouse:', e.message);
        }
      }

      // 2. Web3.Storage (Legacy/Fallback)
      const filecoinToken = await resolveSecretValue(process.env.WEB3_STORAGE_TOKEN, 'GCP_WEB3_STORAGE_TOKEN_SECRET');
      if (filecoinToken) {
        try {
          const resp = await axios.post(
            'https://api.web3.storage/upload',
            JSON.stringify(jsonData),
            {
              headers: {
                'Authorization': `Bearer ${filecoinToken}`,
                'Content-Type': 'application/json'
              },
              timeout: 15000,
            }
          );
          const cid = resp.data?.cid || result.IpfsHash;
          filecoin = { cid, provider: 'web3.storage', gateway: `https://w3s.link/ipfs/${cid}` };
          logger.info(`✅ Replicado en Filecoin (web3.storage): CID ${cid}`);
        } catch (e) {
          logger.warn('No se pudo replicar en Filecoin (web3.storage):', e.message);
        }
      }
      return { ...result, filecoin };
    } catch (error) {
      logger.error('❌ Error pinning JSON to IPFS:', error);
      throw new ServiceUnavailableError('Failed to pin JSON to IPFS.');
    }
  }
}

module.exports = new IpfsService();
