require('dotenv').config();
const mongoose = require('mongoose');
const Redis = require('ioredis');
const axios = require('axios');

const out = (ok, label, detail = '') => {
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} ${label}${detail ? `: ${detail}` : ''}`);
};

(async () => {
  console.log('🔍 Verificando servicios...');
  // MongoDB
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/academicchain';
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    out(true, 'MongoDB');
  } catch (e) { out(false, 'MongoDB', e.message); }
  try { await mongoose.disconnect(); } catch {}

  // Redis
  try {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    const redis = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 0, retryStrategy: () => null, enableReadyCheck: false, password: process.env.REDIS_PASSWORD, username: process.env.REDIS_USERNAME });
    await redis.connect();
    await redis.ping();
    out(true, 'Redis');
    await redis.quit();
  } catch (e) { out(false, 'Redis', e.message); }

  // API readiness
  try {
    const base = process.env.SERVER_URL || process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
    const { data, status } = await axios.get(`${base}/ready`, { timeout: 5000 });
    out(status === 200, 'API Ready', `status=${status}`);
  } catch (e) { out(false, 'API Ready', e.message); }

  // XRPL
  try {
    const enabled = process.env.ENABLE_XRP_PAYMENTS === '1' || process.env.XRPL_ENABLE === '1' || String(process.env.XRPL_ENABLED).toLowerCase() === 'true';
    out(enabled, 'XRPL Config');
  } catch { out(false, 'XRPL Config'); }
})();
