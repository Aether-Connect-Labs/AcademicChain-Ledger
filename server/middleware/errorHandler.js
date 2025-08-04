const { logger } = require('../utils/logger');
const { DatabaseError } = require('sequelize');
const { UnauthorizedError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  logger.error(err.message, {
    stack: err.stack,
    url:   req.originalUrl,
    method: req.method,
    ip:     req.ip,
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Construct the base response object
  let response = {
    success: false,
    status: statusCode,
    message: message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  };
  // Specific error handling
  if (err.name === 'ValidationError') {
    response.message = 'Validation Error';
    response.errors = err.errors;
  } else if (err instanceof DatabaseError) {
    // Handle database-related errors
    response.message = 'Database Error';
    response.dbError = {
      name: err.name,
      message: err.message,
      code: err.original?.code,
      detail: err.original?.detail
    };
  } else if (err.code === 'ECONNREFUSED') {
    response.message = 'Service Unavailable';
    response.status = 503;
  } else if (err instanceof UnauthorizedError) {
      response.message = 'Unauthorized';
      response.status = 401;
  }

  // Send the response

  res
    .status(statusCode)
    .json(response);
};
module.exports = {errorHandler};