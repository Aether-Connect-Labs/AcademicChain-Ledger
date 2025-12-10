const logger = require('./logger');

const CODES = {
  API_VALID_001: { message: 'Ruta no encontrada', severity: 'ERROR', status: 404 },
  RATE_CONN_001: { message: 'Rate oracle connection error', severity: 'WARN', status: 503 },
  RATE_TIMEOUT_001: { message: 'Rate oracle timeout', severity: 'WARN', status: 504 },
  HEDERA_CONN_001: { message: 'Hedera connection error', severity: 'ERROR', status: 503 },
  HEDERA_BALANCE_001: { message: 'Hedera balance fetch error', severity: 'WARN', status: 502 },
  XRPL_CONN_001: { message: 'XRPL connection error', severity: 'ERROR', status: 503 },
  XRPL_BALANCE_001: { message: 'XRPL balance fetch error', severity: 'WARN', status: 502 },
};

function createError(code, message, status, metadata) {
  const base = CODES[code] || { message: message || 'Unknown error', severity: 'ERROR', status: status || 500 };
  const err = new Error(message || base.message);
  err.code = code || 'API_UNK_001';
  err.statusCode = status || base.status;
  err.severity = base.severity;
  err.metadata = metadata || undefined;
  return err;
}

function errorHandler(err, req, res, next) {
  const code = err.code || 'API_UNK_001';
  const severity = err.severity || 'ERROR';
  const status = err.statusCode || 500;
  const message = err.message || (CODES[code]?.message) || 'Internal Server Error';
  logger.error(message, err, { code, severity, url: req.originalUrl });
  res.status(status).json({
    success: false,
    error: { code, message, severity, metadata: err.metadata },
  });
}

module.exports = { ERROR_CODES: CODES, createError, errorHandler };
