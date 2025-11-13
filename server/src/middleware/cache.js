const cacheService = require('../services/cacheService');
const { logger } = require('../utils/logger');

/**
 * Middleware de caché para respuestas HTTP
 * Permite cachear respuestas GET automáticamente
 */
const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    // Solo cachear GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generar clave de caché basada en URL y query params
    const cacheKey = `http:${req.originalUrl || req.url}`;

    try {
      // Intentar obtener del caché
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        logger.debug(`Cache hit for ${cacheKey}`);
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(cached);
      }

      // Si no hay caché, interceptar la respuesta
      const originalJson = res.json;
      res.json = function (data) {
        // Cachear solo respuestas exitosas (2xx)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, data, duration).catch((err) => {
            logger.error('Error caching response:', err);
          });
          res.setHeader('X-Cache', 'MISS');
        }

        // Llamar al método original
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      // En caso de error, continuar sin caché
      next();
    }
  };
};

/**
 * Middleware para invalidar caché después de operaciones de escritura
 */
const invalidateCache = (patterns = []) => {
  return async (req, res, next) => {
    // Interceptar después de que la operación se complete
    const originalJson = res.json;
    res.json = function (data) {
      // Solo invalidar en operaciones exitosas
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Invalidar patrones específicos
        patterns.forEach(async (pattern) => {
          try {
            const deleted = await cacheService.deletePattern(pattern);
            logger.info(`Invalidated ${deleted} cache entries for pattern: ${pattern}`);
          } catch (error) {
            logger.error(`Error invalidating cache pattern ${pattern}:`, error);
          }
        });

        // También invalidar la URL específica si existe
        const cacheKey = `http:${req.originalUrl || req.url}`;
        cacheService.delete(cacheKey).catch((err) => {
          logger.error('Error deleting specific cache key:', err);
        });
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Helper para limpiar caché de un usuario específico
 */
const invalidateUserCache = async (userId) => {
  try {
    const patterns = [
      `user:${userId}*`,
      `http:*/api/users/${userId}*`,
      `http:*/api/nft*userId=${userId}*`,
    ];
    
    for (const pattern of patterns) {
      await cacheService.deletePattern(pattern);
    }
    
    logger.info(`Invalidated cache for user ${userId}`);
  } catch (error) {
    logger.error(`Error invalidating user cache for ${userId}:`, error);
  }
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  invalidateUserCache,
};

