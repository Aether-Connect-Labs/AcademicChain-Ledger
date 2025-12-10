const isTest = (process.env.NODE_ENV || '').toLowerCase() === 'test';
let transports = null;
let winston = null;
try {
  winston = require('winston');
  const DailyRotateFile = require('winston-daily-rotate-file');
  transports = [
    new winston.transports.Console({ level: process.env.LOG_LEVEL || 'info' }),
    new DailyRotateFile({
      dirname: 'logs',
      filename: 'combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: process.env.LOG_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_MAX_FILES || '14d',
      level: process.env.LOG_LEVEL || 'info',
    }),
  ];
} catch {}

let loggerImpl = null;
if (!isTest && winston && transports) {
  const baseFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  );
  const loggerCore = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: baseFormat,
    transports,
  });
  loggerImpl = {
    info: (message, data = {}) => loggerCore.info(message, data),
    warn: (message, data = {}) => loggerCore.warn(message, data),
    error: (message, error = null, context = {}) => loggerCore.error(message, { error: error ? { name: error.name, message: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined } : undefined, ...context }),
  };
} else {
  loggerImpl = {
    info: (message, data = {}) => { if (!isTest) console.log(JSON.stringify({ level: 'info', timestamp: new Date().toISOString(), message, ...data })); },
    warn: (message, data = {}) => { if (!isTest) console.warn(JSON.stringify({ level: 'warn', timestamp: new Date().toISOString(), message, ...data })); },
    error: (message, error = null, context = {}) => { if (!isTest) console.error(JSON.stringify({ level: 'error', timestamp: new Date().toISOString(), message, error: error ? { name: error.name, message: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined } : undefined, ...context })); },
  };
}

module.exports = loggerImpl;

