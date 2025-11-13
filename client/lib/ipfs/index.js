import { create } from 'ipfs-http-client';
import { v4 as uuidv4 } from 'uuid';

// Configuración con múltiples endpoints y fallbacks
const IPFS_CONFIG = {
  primary: {
    url: process.env.NEXT_PUBLIC_IPFS_API_URL || 'https://ipfs.infura.io:5001/api/v0',
    headers: {
      authorization: `Basic ${Buffer.from(
        `${process.env.NEXT_PUBLIC_INFURA_PROJECT_ID}:${process.env.NEXT_PUBLIC_INFURA_PROJECT_SECRET}`
      ).toString('base64')}`
    }
  },
  fallbacks: [
    {
      url: 'https://ipfs.io:5001/api/v0',
      timeout: 10000
    },
    {
      url: 'http://localhost:5001/api/v0',
      timeout: 5000
    }
  ]
};

class IPFSService {
  constructor() {
    this.client = null;
    this.isInitialized = false;
    this.currentEndpoint = null;
    this.initialize();
  }

  async initialize() {
    try {
      // Intentar conectar al endpoint primario primero
      this.client = create(IPFS_CONFIG.primary);
      this.currentEndpoint = 'primary';
      
      // Verificar conexión
      await this.testConnection();
      this.isInitialized = true;
      
      console.log('✅ IPFS Service initialized with primary endpoint');
    } catch (error) {
      console.warn('⚠️ Primary IPFS endpoint failed, trying fallbacks...');
      await this.initializeWithFallbacks();
    }
  }

  async initializeWithFallbacks() {
    for (const [index, fallback] of IPFS_CONFIG.fallbacks.entries()) {
      try {
        this.client = create(fallback);
        this.currentEndpoint = `fallback-${index}`;
        
        await this.testConnection();
        this.isInitialized = true;
        
        console.log(`✅ IPFS Service initialized with fallback endpoint ${index}`);
        return;
      } catch (error) {
        console.warn(`❌ IPFS fallback endpoint ${index} failed:`, error.message);
        continue;
      }
    }
    
    throw new Error('All IPFS endpoints failed. Please check your connection.');
  }

  async testConnection() {
    try {
      const version = await this.client.version();
      console.log(`🔗 Connected to IPFS ${version.version}`);
      return true;
    } catch (error) {
      throw new Error(`IPFS connection test failed: ${error.message}`);
    }
  }

  async uploadMetadata(metadata, options = {}) {
    await this.ensureInitialized();

    const {
      pin = true,
      timeout = 30000,
      retries = 3
    } = options;

    const uploadId = uuidv4();
    const timestamp = new Date().toISOString();

    // Estructura de metadatos mejorada
    const enhancedMetadata = {
      ...metadata,
      _ipfs: {
        uploadId,
        timestamp,
        version: '1.0.0',
        schema: 'academicchain-credential-v1'
      }
    };

    try {
      console.log(`📤 Uploading metadata to IPFS [${uploadId}]...`);

      const result = await this.executeWithRetry(
        async () => {
          const added = await this.client.add(JSON.stringify(enhancedMetadata), {
            pin,
            timeout
          });

          return added;
        },
        retries,
        `IPFS upload [${uploadId}]`
      );

      const cid = result.path;
      
      console.log(`✅ Metadata uploaded successfully: ${cid}`);

      // Emitir evento de upload exitoso
      this.emitUploadEvent('success', {
        cid,
        uploadId,
        metadata: enhancedMetadata,
        size: result.size
      });

      return {
        success: true,
        cid,
        url: this.getIPFSGatewayUrl(cid),
        uploadId,
        size: result.size,
        timestamp
      };

    } catch (error) {
      console.error(`❌ IPFS upload failed [${uploadId}]:`, error);

      this.emitUploadEvent('error', {
        uploadId,
        error: error.message,
        metadata: enhancedMetadata
      });

      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }

  async uploadFile(file, options = {}) {
    await this.ensureInitialized();

    const {
      pin = true,
      timeout = 60000,
      maxFileSize = 50 * 1024 * 1024, // 50MB default
      onProgress = () => {}
    } = options;

    // Validaciones de archivo
    if (file.size > maxFileSize) {
      throw new Error(`File size too large: ${file.size} bytes. Maximum allowed: ${maxFileSize} bytes.`);
    }

    const uploadId = uuidv4();

    try {
      console.log(`📤 Uploading file to IPFS [${uploadId}]: ${file.name}`);

      const result = await this.client.add(file, {
        pin,
        timeout,
        progress: (bytes) => onProgress((bytes / file.size) * 100)
      });

      const cid = result.path;
      
      console.log(`✅ File uploaded successfully: ${cid}`);

      return {
        success: true,
        cid,
        url: this.getIPFSGatewayUrl(cid),
        uploadId,
        filename: file.name,
        size: file.size,
        type: file.type,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ File upload failed [${uploadId}]:`, error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  async retrieveMetadata(cid, options = {}) {
    await this.ensureInitialized();

    const {
      timeout = 15000,
      retries = 2
    } = options;

    try {
      console.log(`📥 Retrieving metadata from IPFS: ${cid}`);

      const content = await this.executeWithRetry(
        async () => {
          const chunks = [];
          for await (const chunk of this.client.cat(cid)) {
            chunks.push(chunk);
          }
          return Buffer.concat(chunks).toString();
        },
        retries,
        `IPFS retrieve [${cid}]`
      );

      const metadata = JSON.parse(content);

      // Validar estructura de metadatos
      this.validateMetadata(metadata);

      console.log(`✅ Metadata retrieved successfully: ${cid}`);

      return {
        success: true,
        metadata,
        cid,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Metadata retrieval failed for ${cid}:`, error);
      throw new Error(`Metadata retrieval failed: ${error.message}`);
    }
  }

  async pinCID(cid, options = {}) {
    await this.ensureInitialized();

    try {
      console.log(`📌 Pinning CID: ${cid}`);

      await this.client.pin.add(cid, {
        timeout: options.timeout || 10000
      });

      console.log(`✅ CID pinned successfully: ${cid}`);

      return {
        success: true,
        cid,
        pinned: true,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ CID pinning failed for ${cid}:`, error);
      throw new Error(`CID pinning failed: ${error.message}`);
    }
  }

  async unpinCID(cid, options = {}) {
    await this.ensureInitialized();

    try {
      console.log(`📌 Unpinning CID: ${cid}`);

      await this.client.pin.rm(cid, {
        timeout: options.timeout || 10000
      });

      console.log(`✅ CID unpinned successfully: ${cid}`);

      return {
        success: true,
        cid,
        pinned: false,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ CID unpinning failed for ${cid}:`, error);
      throw new Error(`CID unpinning failed: ${error.message}`);
    }
  }

  async getPinnedItems() {
    await this.ensureInitialized();

    try {
      const pins = [];
      for await (const { cid, type } of this.client.pin.ls()) {
        pins.push({ cid: cid.toString(), type });
      }

      return {
        success: true,
        pins,
        count: pins.length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Failed to get pinned items:', error);
      throw new Error(`Failed to get pinned items: ${error.message}`);
    }
  }

  getIPFSGatewayUrl(cid, gateway = 'cloudflare') {
    const gateways = {
      cloudflare: `https://cloudflare-ipfs.com/ipfs/${cid}`,
      ipfsio: `https://ipfs.io/ipfs/${cid}`,
      dweb: `https://dweb.link/ipfs/${cid}`,
      infura: `https://ipfs.infura.io/ipfs/${cid}`,
      local: `http://localhost:8080/ipfs/${cid}`
    };

    return gateways[gateway] || gateways.cloudflare;
  }

  // Métodos de utilidad internos
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isInitialized) {
      throw new Error('IPFS service is not initialized. Please check your connection.');
    }
  }

  async executeWithRetry(operation, maxRetries, operationName) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ ${operationName} attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Esperar antes de reintentar (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  validateMetadata(metadata) {
    if (!metadata || typeof metadata !== 'object') {
      throw new Error('Invalid metadata: must be an object');
    }

    // Validaciones específicas para AcademicChain
    if (metadata._ipfs?.schema !== 'academicchain-credential-v1') {
      console.warn('⚠️ Metadata schema validation warning: unexpected schema version');
    }

    return true;
  }

  emitUploadEvent(type, data) {
    // Emitir evento personalizado para que otros componentes puedan escuchar
    if (typeof window !== 'undefined') {
      const event = new CustomEvent(`ipfs-upload-${type}`, { detail: data });
      window.dispatchEvent(event);
    }
  }

  // Métodos de gestión de estado
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      currentEndpoint: this.currentEndpoint,
      timestamp: new Date().toISOString()
    };
  }

  async healthCheck() {
    try {
      await this.testConnection();
      return {
        healthy: true,
        endpoint: this.currentEndpoint,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        endpoint: this.currentEndpoint,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Singleton instance
const IPFSServiceInstance = new IPFSService();

// Exportar tanto la instancia como la clase
export { IPFSService };
export default IPFSServiceInstance;