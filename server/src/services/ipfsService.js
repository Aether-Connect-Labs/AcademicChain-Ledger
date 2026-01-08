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
let stream = null;
try {
  pinataSDK = require('@pinata/sdk');
} catch (error) {
  logger.warn('@pinata/sdk not installed. IPFS functionality will be disabled.');
}
try { stream = require('stream'); } catch {}

class IpfsService {
  constructor() {
    const jwt = String(process.env.PINATA_JWT || '').trim();
    if (jwt) {
      this.pinata = { jwt };
      return;
    }
    if (pinataSDK && process.env.PINATA_API_KEY && process.env.PINATA_SECRET_API_KEY) {
      this.pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_API_KEY);
    } else {
      logger.warn('Pinata not configured. Set PINATA_JWT or API keys to enable IPFS.');
      this.pinata = null;
    }
  }

  async testConnection() {
    if (!this.pinata) return;
    try {
      if (this.pinata.jwt) {
        const resp = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
          headers: { Authorization: `Bearer ${this.pinata.jwt}` },
          timeout: 8000
        });
        if (resp.status === 200) logger.info('✅ Successfully connected to Pinata IPFS (JWT)');
      } else {
        await this.pinata.testAuthentication();
        logger.info('✅ Successfully connected to Pinata IPFS');
      }
    } catch (error) {
      logger.error('❌ Failed to connect to Pinata IPFS. Check your API keys.', error.message);
      // No lanzamos un error para no detener el servidor, pero la funcionalidad de IPFS no estará disponible.
    }
  }

  async pinJson(jsonData, name) {
    if (!this.pinata) throw new ServiceUnavailableError('IPFS service is not configured.');
    try {
      let result = null;
      const metaName = name || `AcademicChain-Credential-${new Date().toISOString()}`;
      if (this.pinata.jwt) {
        const resp = await axios.post(
          'https://api.pinata.cloud/pinning/pinJSONToIPFS',
          { pinataContent: jsonData, pinataMetadata: { name: metaName }, pinataOptions: { cidVersion: 0 } },
          { headers: { Authorization: `Bearer ${this.pinata.jwt}` }, timeout: 15000 }
        );
        result = { IpfsHash: resp.data?.IpfsHash };
      } else {
        const options = { pinataMetadata: { name: metaName }, pinataOptions: { cidVersion: 0 } };
        result = await this.pinata.pinJSONToIPFS(jsonData, options);
      }
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

  async pinFile(buffer, filename, mime) {
    if (!this.pinata) throw new ServiceUnavailableError('IPFS service is not configured.');
    try {
      if (this.pinata.jwt) {
        const FormData = require('form-data');
        const form = new FormData();
        form.append('file', buffer, { filename: filename || `document-${Date.now()}.pdf`, contentType: mime || 'application/pdf' });
        const resp = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', form, {
          headers: { Authorization: `Bearer ${this.pinata.jwt}`, ...form.getHeaders() },
          timeout: 30000
        });
        return { IpfsHash: resp.data?.IpfsHash };
      } else {
        if (!pinataSDK || !stream) throw new ServiceUnavailableError('Pinata SDK not available');
        const readable = new stream.Readable();
        readable._read = () => {};
        readable.push(buffer);
        readable.push(null);
        const options = { pinataMetadata: { name: filename || `document-${Date.now()}.pdf` }, pinataOptions: { cidVersion: 0 } };
        const res = await this.pinata.pinFileToIPFS(readable, options);
        return { IpfsHash: res.IpfsHash };
      }
    } catch (e) {
      logger.error('❌ Error pinning file to IPFS:', e);
      throw new ServiceUnavailableError('Failed to pin file to IPFS.');
    }
  }
}

module.exports = new IpfsService();
