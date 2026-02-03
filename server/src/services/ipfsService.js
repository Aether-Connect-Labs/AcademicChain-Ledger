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

  async pinFile(fileInput, filename, mime) {
    if (!this.pinata) throw new ServiceUnavailableError('IPFS service is not configured.');
    const fs = require('fs');
    
    // Determine if fileInput is a Buffer or a Path
    const isBuffer = Buffer.isBuffer(fileInput);
    const isPath = typeof fileInput === 'string' && fs.existsSync(fileInput);

    if (!isBuffer && !isPath) {
        throw new Error('pinFile expects a Buffer or a valid file path.');
    }

    const pinataPromise = (async () => {
      try {
        if (this.pinata.jwt) {
          const FormData = require('form-data');
          const form = new FormData();
          
          if (isPath) {
             form.append('file', fs.createReadStream(fileInput), { filename: filename || 'document.pdf', contentType: mime || 'application/pdf' });
          } else {
             form.append('file', fileInput, { filename: filename || `document-${Date.now()}.pdf`, contentType: mime || 'application/pdf' });
          }
          
          const resp = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', form, {
            headers: { Authorization: `Bearer ${this.pinata.jwt}`, ...form.getHeaders() },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 60000 
          });
          logger.info(`📌 Pinata Upload Success: ${resp.data?.IpfsHash}`);
          return { cid: resp.data?.IpfsHash, provider: 'pinata' };
        } else {
            // SDK Fallback (supports streams)
            if (!pinataSDK || !stream) throw new ServiceUnavailableError('Pinata SDK not available');
            const readable = isPath ? fs.createReadStream(fileInput) : new stream.Readable();
            if (!isPath) {
                readable._read = () => {};
                readable.push(fileInput);
                readable.push(null);
            }
            const options = { pinataMetadata: { name: filename || `document-${Date.now()}.pdf` }, pinataOptions: { cidVersion: 0 } };
            const res = await this.pinata.pinFileToIPFS(readable, options);
            logger.info(`📌 Pinata SDK Upload Success: ${res.IpfsHash}`);
            return { cid: res.IpfsHash, provider: 'pinata' };
        }
      } catch (e) {
        logger.error(`❌ Pinata Upload Failed: ${e.message}`);
        throw e;
      }
    })();

    const lighthousePromise = (async () => {
        const lighthouseKey = process.env.LIGHTHOUSE_API_KEY;
        if (!lighthouseKey) return null;
        try {
            const lighthouse = require('@lighthouse-web3/sdk');
            let uploadResponse;
            
            // Retry logic for Lighthouse
            const uploadWithRetry = async (retries = 3) => {
                try {
                    if (isPath) {
                        return await lighthouse.upload(fileInput, lighthouseKey);
                    } else {
                        return await lighthouse.uploadBuffer(fileInput, lighthouseKey);
                    }
                } catch (err) {
                    if (retries > 0) {
                        logger.warn(`⚠️ Retrying Lighthouse upload... (${retries} attempts left)`);
                        await new Promise(r => setTimeout(r, 1000));
                        return uploadWithRetry(retries - 1);
                    }
                    throw err;
                }
            };

            uploadResponse = await uploadWithRetry();
            
            const cid = uploadResponse.data.Hash;
            logger.info(`✅ Lighthouse (Filecoin) Upload Success: CID ${cid}`);
            return { 
                cid, 
                provider: 'lighthouse', 
                gateway: `https://gateway.lighthouse.storage/ipfs/${cid}` 
            };
        } catch (e) {
             logger.error(`❌ Lighthouse Upload Failed: ${e.message}`);
             throw e;
        }
    })();

    // "Atomic" / Parallel Execution
    const results = await Promise.allSettled([pinataPromise, lighthousePromise]);
    
    const pinataResult = results[0];
    const lighthouseResult = results[1];

    let finalResult = {};

    // Critical: Pinata (Hot Layer) must succeed for immediate availability
    if (pinataResult.status === 'fulfilled') {
        finalResult = { IpfsHash: pinataResult.value.cid };
    } else {
        // If Pinata fails, check if Lighthouse succeeded
        if (lighthouseResult.status === 'fulfilled' && lighthouseResult.value) {
             logger.warn('⚠️ Pinata failed, but Lighthouse succeeded. Using Lighthouse CID as primary.');
             finalResult = { IpfsHash: lighthouseResult.value.cid };
        } else {
             throw new ServiceUnavailableError('Failed to upload to both Pinata and Lighthouse.');
        }
    }

    // Attach Filecoin result if available
    if (lighthouseResult.status === 'fulfilled' && lighthouseResult.value) {
        finalResult.filecoin = lighthouseResult.value;
    } else {
        // If Lighthouse failed, we might want to queue a retry (handled by "avisar" part of prompt)
        finalResult.filecoin = { error: 'Upload failed', provider: 'lighthouse' };
        logger.warn('⚠️ Filecoin replication failed. Needs background retry.');
    }

    return finalResult;
  }

  async pinEncryptedJson(jsonData, name, secretKey) {
    if (!this.pinata) throw new ServiceUnavailableError('IPFS service is not configured.');
    try {
      const crypto = require('crypto');
      const algorithm = 'aes-256-cbc';
      const key = crypto.createHash('sha256').update(String(secretKey)).digest('base64').substr(0, 32);
      const iv = crypto.randomBytes(16);

      const cipher = crypto.createCipheriv(algorithm, key, iv);
      let encrypted = cipher.update(JSON.stringify(jsonData), 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const encryptedData = {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
      };

      return this.pinJson(encryptedData, name);
    } catch (error) {
      logger.error('❌ Error pinning encrypted JSON to IPFS:', error);
      throw new ServiceUnavailableError('Failed to pin encrypted JSON to IPFS.');
    }
  }
}

module.exports = new IpfsService();
