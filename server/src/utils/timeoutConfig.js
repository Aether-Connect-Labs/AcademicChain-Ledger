const DEFAULTS = {
  development: {
    rateOracle: 30000,
    hedera: 30000,
    xrpl: 20000,
    redis: 10000,
    mongo: 15000,
    externalApi: 15000,
    socketHeartbeat: 120000,
    apiRequest: 30000,
  },
  production: {
    rateOracle: 10000,
    hedera: 15000,
    xrpl: 10000,
    redis: 5000,
    mongo: 10000,
    externalApi: 8000,
    socketHeartbeat: 60000,
    apiRequest: 15000,
  }
};

const ENV_MAP = {
  rateOracle: ['RATE_ORACLE_TIMEOUT_MS'],
  hedera: ['HEDERA_TIMEOUT_MS'],
  xrpl: ['XRPL_TIMEOUT_MS'],
  redis: ['REDIS_TIMEOUT_MS'],
  mongo: ['MONGO_TIMEOUT_MS'],
  externalApi: ['EXTERNAL_API_TIMEOUT_MS'],
  socketHeartbeat: ['SOCKET_HEARTBEAT_TIMEOUT_MS'],
  apiRequest: ['API_REQUEST_TIMEOUT_MS','REQUEST_TIMEOUT'],
};

class TimeoutManager {
  static getEnvTimeout(serviceName) {
    const keys = ENV_MAP[serviceName] || [];
    for (const k of keys) {
      const v = process.env[k];
      const n = parseInt(String(v || ''), 10);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return null;
  }

  static getTimeout(serviceName) {
    const envVal = this.getEnvTimeout(serviceName);
    if (envVal) return envVal;
    const env = (process.env.NODE_ENV || 'development') === 'production' ? 'production' : 'development';
    const byEnv = DEFAULTS[env]?.[serviceName];
    return Number.isFinite(byEnv) ? byEnv : 10000;
  }

  static createAbortSignal(serviceName) {
    const timeoutMs = this.getTimeout(serviceName);
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = setTimeout(() => { if (controller) controller.abort(); }, timeoutMs);
    return { signal: controller ? controller.signal : undefined, timeoutId, timeoutMs };
  }

  static validateAll() {
    const max = 300000;
    for (const key of Object.keys(ENV_MAP)) {
      const v = this.getEnvTimeout(key) || this.getTimeout(key);
      if (!Number.isFinite(v) || v <= 0 || v > max) {
        throw new Error(`Invalid timeout for ${key}: ${v}`);
      }
    }
    return true;
  }

  static async fetchWithTimeout(url, options = {}, serviceName = 'externalApi') {
    const { signal, timeoutId, timeoutMs } = this.createAbortSignal(serviceName);
    const axios = require('axios');
    try {
      const res = await axios.get(url, { ...(options || {}), timeout: timeoutMs, signal });
      return res;
    } catch (e) {
      if (e.name === 'AbortError') {
        const err = new Error(`Request aborted by timeout (${timeoutMs}ms)`);
        err.name = 'TimeoutError';
        throw err;
      }
      throw e;
    } finally {
      try { clearTimeout(timeoutId); } catch {}
    }
  }

  static async promiseWithTimeout(promise, serviceName, customTimeout) {
    const timeoutMs = Number.isFinite(customTimeout) ? customTimeout : this.getTimeout(serviceName);
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => {
        const err = new Error(`Operation timed out after ${timeoutMs}ms`);
        err.name = 'TimeoutError';
        reject(err);
      }, timeoutMs);
    });
    try {
      const result = await Promise.race([promise, timeoutPromise]);
      return result;
    } finally {
      try { clearTimeout(timer); } catch {}
    }
  }
}

module.exports = { TimeoutManager, TIMEOUT_DEFAULTS: DEFAULTS };
