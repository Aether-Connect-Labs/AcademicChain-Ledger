const apiKeyService = require('../services/apiKeyService');
const logger = require('../utils/logger');

/**
 * Middleware para validar API Keys en las rutas protegidas
 * @param {string|string[]} permissions - Permisos requeridos para acceder a la ruta
 */
function requireApiKey(permissions = []) {
  return (req, res, next) => {
    // Obtener la API Key del header
    // Added support for x-acl-auth-key as per security requirements
    const apiKey = req.headers['x-api-key'] || req.headers['x-acl-auth-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      logger.warn('❌ API Key no proporcionada en la solicitud');
      return res.status(401).json({
        success: false,
        error: 'API Key requerida',
        message: 'Por favor proporcione una API Key válida en el header X-API-Key, x-acl-auth-key o Authorization'
      });
    }

    // Validar la API Key
    const validation = apiKeyService.validateApiKey(apiKey);
    
    if (!validation.valid) {
      logger.warn(`❌ API Key inválida: ${validation.error}`);
      return res.status(401).json({
        success: false,
        error: 'API Key inválida',
        message: validation.error
      });
    }

    // Verificar permisos si se especificaron
    if (permissions.length > 0) {
      const hasRequiredPermission = permissions.some(permission => 
        apiKeyService.hasPermission(validation, permission)
      );

      if (!hasRequiredPermission) {
        logger.warn(`❌ API Key ${validation.keyId} no tiene los permisos requeridos: ${permissions.join(', ')}`);
        return res.status(403).json({
          success: false,
          error: 'Permisos insuficientes',
          message: `Su API Key no tiene los permisos requeridos: ${permissions.join(', ')}`
        });
      }
    }

    // Agregar información de la API Key al request para uso posterior
    req.apiKeyInfo = {
      keyId: validation.keyId,
      name: validation.name,
      permissions: validation.permissions
    };

    logger.info(`✅ API Key ${validation.keyId} (${validation.name}) autorizada para ${req.method} ${req.path}`);
    next();
  };
}

/**
 * Middleware opcional para logging de uso de API
 */
function logApiUsage(req, res, next) {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const apiKeyInfo = req.apiKeyInfo;
    
    if (apiKeyInfo) {
      logger.info(`📊 API Usage: ${req.method} ${req.path} - ${res.statusCode} (${duration}ms) - Key: ${apiKeyInfo.keyId}`);
    }
  });
  
  next();
}

module.exports = {
  requireApiKey,
  logApiUsage
};