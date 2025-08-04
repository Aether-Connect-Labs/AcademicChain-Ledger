// Usaremos MongoDB/PostgreSQL para almacenar los partners y sus keys
const { Partner } = require('../models'); // Asume un modelo de base de datos
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');
const bcrypt = require('bcryptjs');

/**
 * Genera una API key para un nuevo partner (ej. una empresa de RRHH).
 * @param {string} partnerName - El nombre de la empresa partner.
 * @returns {object} - El nuevo partner con su API key.
 */
const generateApiKey = async (partnerName) => {
  const prefix = `acp_${uuidv4().slice(0, 8)}`;
  const secret = uuidv4().replace(/-/g, '');
  const fullApiKey = `${prefix}_${secret}`;

  const salt = await bcrypt.genSalt(10);
  const keyHash = await bcrypt.hash(secret, salt);

  const newPartner = new Partner({ name: partnerName, keyPrefix: prefix, keyHash });
  await newPartner.save();

  logger.info(`Nueva API Key generada para ${partnerName}`);
  // Devolvemos la clave completa solo una vez. No se almacenará en texto plano.
  return { partner: newPartner, apiKey: fullApiKey };
};

/**
 * Valida una API key.
 * @param {string} apiKey - La API key a validar.
 * @returns {object|null} - El partner si la key es válida, o null.
 */
const validateApiKey = async (apiKey) => {
  // La validación ahora ocurre en el middleware `partnerAuth`
  throw new Error('validateApiKey is deprecated. Use partnerAuth middleware.');
};

module.exports = { generateApiKey, validateApiKey };