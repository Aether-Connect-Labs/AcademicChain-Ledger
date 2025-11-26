const { Developer, Partner } = require('../models');
const { compare } = require('bcryptjs');
const { UnauthorizedError } = require('../utils/errors');

module.exports = async function apiKeyAuth(req, res, next) {
  const apiKey = req.header('x-api-key');
  if (!apiKey) return next(new UnauthorizedError('API key missing'));
  try {
    if (apiKey.startsWith('ak_')) {
      const parts = apiKey.split('_');
      if (parts.length !== 3) return next(new UnauthorizedError('Invalid API key format'));
      const prefix = `${parts[0]}_${parts[1]}`;
      const secret = parts[2];
      const dev = await Developer.findOne({ apiKeyPrefix: prefix, isActive: true });
      if (!dev || !dev.apiKeyHash) return next(new UnauthorizedError('Invalid API key'));
      const ok = await compare(secret, dev.apiKeyHash);
      if (!ok) return next(new UnauthorizedError('Invalid API key'));
      req.apiConsumer = { type: 'developer', plan: dev.plan, id: dev.id, email: dev.email };
      return next();
    }
    if (apiKey.startsWith('acp_')) {
      const parts = apiKey.split('_');
      if (parts.length !== 3) return next(new UnauthorizedError('Invalid API key format'));
      const prefix = `${parts[0]}_${parts[1]}`;
      const secret = parts[2];
      const partner = await Partner.findOne({ keyPrefix: prefix, isActive: true });
      if (!partner || !partner.keyHash) return next(new UnauthorizedError('Invalid API key'));
      const ok = await compare(secret, partner.keyHash);
      if (!ok) return next(new UnauthorizedError('Invalid API key'));
      req.apiConsumer = { type: 'partner', plan: partner.plan || 'enterprise', id: partner.id, email: partner.contactEmail };
      return next();
    }
    return next(new UnauthorizedError('Unsupported API key prefix'));
  } catch (e) {
    return next(new UnauthorizedError('Authentication failed'));
  }
}