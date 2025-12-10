const { validationResult } = require('express-validator');
const { BadRequestError } = require('../utils/errors');
const cacheService = require('../services/cacheService');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    try { cacheService.increment('metrics:error_total:validation:api', 1); } catch {}
    throw new BadRequestError('Validation failed', errors.array());
  }
  next();
};

module.exports = { validate };
