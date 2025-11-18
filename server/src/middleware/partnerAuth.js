const Partner = require('../models/Partner');
const { logger } = require('../utils/logger');
const { UnauthorizedError } = require('../utils/errors');
const { compare } = require('bcryptjs'); // Asumimos que usas bcryptjs para hashear

const partnerAuth = async (req, res, next) => {
  if (process.env.NODE_ENV !== 'production' && req.query && req.query.mock === '1') {
    req.partner = {
      id: 'mock-partner',
      name: 'Mock Institution',
      universityId: req.query.universityId || 'mock-university',
      permissions: ['verify_credential', 'mint_credential']
    };
    return next();
  }
  const apiKey = req.header('x-api-key');

  if (!apiKey) {
    return next(new UnauthorizedError('API key is missing. Provide it in the x-api-key header.'));
  }

  try {
    // **Autenticación de API Key Segura y Eficiente**
    // Formato esperado: `acp_prefijoUnico_secretoLargo`
    // 1. El `prefijoUnico` es público y se usa para buscar en la BD (debe estar indexado).
    // 2. El `secretoLargo` nunca se almacena, solo su hash.

    const keyParts = apiKey.split('_');
    if (keyParts.length !== 3 || keyParts[0] !== 'acp') {
      return next(new UnauthorizedError('Invalid API key format.'));
    }

    const keyPrefix = `${keyParts[0]}_${keyParts[1]}`;
    const keySecret = keyParts[2];

    // Búsqueda ultra-rápida por el prefijo indexado.
    const partner = await Partner.findOne({ keyPrefix: keyPrefix, isActive: true });

    if (!partner || !partner.keyHash) {
      return next(new UnauthorizedError('Invalid API key'));
    }

    // Comparación segura en tiempo constante para evitar ataques de temporización.
    const isKeyValid = await compare(keySecret, partner.keyHash);

    if (!isKeyValid) {
      return next(new UnauthorizedError('Invalid API key'));
    }

    req.partner = partner;
    next();
  } catch (error) {
    logger.error('Error during partner authentication:', error);
    return next(new UnauthorizedError('Authentication failed'));
  }
};

module.exports = partnerAuth;
