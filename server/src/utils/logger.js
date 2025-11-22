// Logger simple compatible con Vercel (solo console transport)
const logger = {
  info: (message, data = {}) =\u003e {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      ...data
    }));
  },
  
  error: (message, error = null, context = {}) =\u003e {
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
  
  warn: (message, data = {}) =\u003e {
    console.warn(JSON.stringify({
      level: 'warn',
      timestamp: new Date().toISOString(),
      message,
      ...data
    }));
  }
};

module.exports = logger;

