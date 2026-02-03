const crypto = require('crypto');
const logger = require('../utils/logger');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
  }

  /**
   * Generates a random 256-bit key (32 bytes)
   */
  generateKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Encrypts a buffer using a specific key.
   * Returns the encrypted buffer (IV + Tag + EncryptedData)
   * @param {Buffer} buffer 
   * @param {string} keyHex 
   */
  encryptBuffer(buffer, keyHex) {
    try {
      const key = Buffer.from(keyHex, 'hex');
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      
      const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
      const tag = cipher.getAuthTag();

      // Return combined buffer: IV (16) + Tag (16) + EncryptedData
      return Buffer.concat([iv, tag, encrypted]);
    } catch (error) {
      logger.error('Encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypts a buffer using a specific key.
   * Expects the buffer format: IV (16) + Tag (16) + EncryptedData
   * @param {Buffer} encryptedBuffer 
   * @param {string} keyHex 
   */
  decryptBuffer(encryptedBuffer, keyHex) {
    try {
      const key = Buffer.from(keyHex, 'hex');
      
      const iv = encryptedBuffer.subarray(0, 16);
      const tag = encryptedBuffer.subarray(16, 32);
      const text = encryptedBuffer.subarray(32);

      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag);

      return Buffer.concat([decipher.update(text), decipher.final()]);
    } catch (error) {
      logger.error('Decryption failed:', error);
      throw new Error('Decryption failed');
    }
  }
}

module.exports = new EncryptionService();
