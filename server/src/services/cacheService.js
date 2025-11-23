const redis = require('../../queue/connection');
const logger = require('../utils/logger');

/**
 * Servicio de caché escalable usando Redis
 * Soporta diferentes estrategias de expiración y invalidación
 */
class CacheService {
  constructor() {
    this.defaultTTL = parseInt(process.env.CACHE_DEFAULT_TTL || '3600', 10); // 1 hora por defecto
    this.keyPrefix = process.env.CACHE_KEY_PREFIX || 'academicchain:';
  }

  /**
   * Genera una clave de caché con prefijo
   */
  _getKey(key) {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Obtiene un valor del caché
   * @param {string} key - Clave del caché
   * @returns {Promise<*>} Valor almacenado o null si no existe
   */
  async get(key) {
    try {
      if (!redis.isConnected()) {
        logger.warn('Redis not connected, cache miss');
        return null;
      }

      const fullKey = this._getKey(key);
      const value = await redis.get(fullKey);
      
      if (value) {
        try {
          return JSON.parse(value);
        } catch (e) {
          // Si no es JSON, retornar el valor directamente
          return value;
        }
      }
      
      return null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null; // En caso de error, retornar null (cache miss)
    }
  }

  /**
   * Almacena un valor en el caché
   * @param {string} key - Clave del caché
   * @param {*} value - Valor a almacenar
   * @param {number} ttl - Time to live en segundos (opcional)
   * @returns {Promise<boolean>} true si se guardó correctamente
   */
  async set(key, value, ttl = null) {
    try {
      if (!redis.isConnected()) {
        logger.warn('Redis not connected, skipping cache set');
        return false;
      }

      const fullKey = this._getKey(key);
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      const expiration = ttl || this.defaultTTL;

      if (expiration > 0) {
        await redis.setex(fullKey, expiration, serializedValue);
      } else {
        await redis.set(fullKey, serializedValue);
      }

      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Elimina un valor del caché
   * @param {string} key - Clave del caché
   * @returns {Promise<boolean>} true si se eliminó correctamente
   */
  async delete(key) {
    try {
      if (!redis.isConnected()) {
        return false;
      }

      const fullKey = this._getKey(key);
      const result = await redis.del(fullKey);
      return result > 0;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Elimina múltiples claves que coincidan con un patrón
   * @param {string} pattern - Patrón de búsqueda (ej: 'user:*')
   * @returns {Promise<number>} Número de claves eliminadas
   */
  async deletePattern(pattern) {
    try {
      if (!redis.isConnected()) {
        return 0;
      }

      const fullPattern = this._getKey(pattern);
      let cursor = '0';
      let deletedCount = 0;

      do {
        const [nextCursor, keys] = await redis.scan(
          cursor,
          'MATCH',
          fullPattern,
          'COUNT',
          100
        );
        
        cursor = nextCursor;
        
        if (keys.length > 0) {
          const deleted = await redis.del(...keys);
          deletedCount += deleted;
        }
      } while (cursor !== '0');

      return deletedCount;
    } catch (error) {
      logger.error(`Cache delete pattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Obtiene múltiples valores del caché
   * @param {string[]} keys - Array de claves
   * @returns {Promise<Object>} Objeto con clave-valor
   */
  async mget(keys) {
    try {
      if (!redis.isConnected() || keys.length === 0) {
        return {};
      }

      const fullKeys = keys.map(key => this._getKey(key));
      const values = await redis.mget(...fullKeys);
      
      const result = {};
      keys.forEach((key, index) => {
        if (values[index]) {
          try {
            result[key] = JSON.parse(values[index]);
          } catch (e) {
            result[key] = values[index];
          }
        }
      });

      return result;
    } catch (error) {
      logger.error(`Cache mget error:`, error);
      return {};
    }
  }

  /**
   * Almacena múltiples valores en el caché
   * @param {Object} keyValues - Objeto clave-valor
   * @param {number} ttl - Time to live en segundos (opcional)
   * @returns {Promise<boolean>} true si se guardó correctamente
   */
  async mset(keyValues, ttl = null) {
    try {
      if (!redis.isConnected()) {
        return false;
      }

      const pipeline = redis.pipeline();
      const expiration = ttl || this.defaultTTL;

      for (const [key, value] of Object.entries(keyValues)) {
        const fullKey = this._getKey(key);
        const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
        
        if (expiration > 0) {
          pipeline.setex(fullKey, expiration, serializedValue);
        } else {
          pipeline.set(fullKey, serializedValue);
        }
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error(`Cache mset error:`, error);
      return false;
    }
  }

  /**
   * Verifica si una clave existe en el caché
   * @param {string} key - Clave del caché
   * @returns {Promise<boolean>} true si existe
   */
  async exists(key) {
    try {
      if (!redis.isConnected()) {
        return false;
      }

      const fullKey = this._getKey(key);
      const result = await redis.exists(fullKey);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Incrementa un valor numérico en el caché
   * @param {string} key - Clave del caché
   * @param {number} increment - Valor a incrementar (default: 1)
   * @returns {Promise<number>} Nuevo valor
   */
  async increment(key, increment = 1) {
    try {
      if (!redis.isConnected()) {
        return null;
      }

      const fullKey = this._getKey(key);
      return await redis.incrby(fullKey, increment);
    } catch (error) {
      logger.error(`Cache increment error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Limpia todo el caché (solo con prefijo del servicio)
   * @returns {Promise<number>} Número de claves eliminadas
   */
  async flush() {
    return this.deletePattern('*');
  }

  /**
   * Obtiene estadísticas del caché
   * @returns {Promise<Object>} Estadísticas
   */
  async getStats() {
    try {
      if (!redis.isConnected()) {
        return { connected: false };
      }

      const info = await redis.info('stats');
      const memory = await redis.info('memory');
      
      return {
        connected: true,
        stats: info,
        memory: memory,
      };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return { connected: false, error: error.message };
    }
  }
}

// Singleton instance
const cacheService = new CacheService();

module.exports = cacheService;

