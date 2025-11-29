// Logger simple compatible con Vercel (solo console transport)
const isTest = (process.env.NODE_ENV || '').toLowerCase() === 'test';
const logger = {
  info: (message, data = {}) => {
    if (isTest) return;
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      ...data
    }));
  },
  
  error: (message, error = null, context = {}) => {
    if (isTest) return;
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } : undefined,
      ...context
    }));
  },
  
  warn: (message, data = {}) => {
    if (isTest) return;
    console.warn(JSON.stringify({
      level: 'warn',
      timestamp: new Date().toISOString(),
      message,
      ...data
    }));
  }
};

module.exports = logger;

