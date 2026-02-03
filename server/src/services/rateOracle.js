const axios = require('axios');
const { TimeoutManager } = require('../utils/timeoutConfig');
const { createError } = require('../utils/errorCodes');
const cacheService = require('./cacheService');
const logger = require('../utils/logger');
const { ExchangeRate } = require('../models');

const WEIGHTS = { binance: 0.4, coinbase: 0.3, kraken: 0.2, hedera: 0.1 };
const CACHE_KEY = 'exchange:xrphbar';
const OVERRIDE_KEY = 'exchange:xrphbar:override';
const TTL_SECONDS = 300;

const safeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * Obtiene precios de Binance con backoff y timeout de 10s
 */
async function fetchBinance() {
  try {
    const [xrp, hbar] = await Promise.all([
      getWithRetry('https://api.binance.com/api/v3/ticker/price?symbol=XRPUSDT'),
      getWithRetry('https://api.binance.com/api/v3/ticker/price?symbol=HBARUSDT'),
    ]);
    const xrpUsd = safeNumber(xrp.data?.price);
    const hbarUsd = safeNumber(hbar.data?.price);
    return { source: 'Binance', xrpUsd, hbarUsd };
  } catch (e) {
    const code = e.name === 'TimeoutError' ? 'RATE_TIMEOUT_001' : 'RATE_CONN_001';
    return { source: 'Binance', error: e.message, code };
  }
}

/**
 * Obtiene precios de Coinbase con backoff y timeout de 10s
 */
async function fetchCoinbase() {
  try {
    const [xrp, hbar] = await Promise.all([
      getWithRetry('https://api.coinbase.com/v2/prices/XRP-USD/spot'),
      getWithRetry('https://api.coinbase.com/v2/prices/HBAR-USD/spot'),
    ]);
    const xrpUsd = safeNumber(xrp.data?.data?.amount);
    const hbarUsd = safeNumber(hbar.data?.data?.amount);
    return { source: 'Coinbase', xrpUsd, hbarUsd };
  } catch (e) {
    const code = e.name === 'TimeoutError' ? 'RATE_TIMEOUT_001' : 'RATE_CONN_001';
    return { source: 'Coinbase', error: e.message, code };
  }
}

/**
 * Obtiene precios de Kraken con backoff y timeout de 10s
 */
async function fetchKraken() {
  try {
    const [xrp, hbar] = await Promise.all([
      getWithRetry('https://api.kraken.com/0/public/Ticker?pair=XRPUSD'),
      getWithRetry('https://api.kraken.com/0/public/Ticker?pair=HBARUSD'),
    ]);
    const parseTicker = (resp) => {
      const result = resp.data?.result || {};
      const first = Object.values(result)[0];
      const px = first?.c?.[0];
      return safeNumber(px);
    };
    const xrpUsd = parseTicker(xrp);
    const hbarUsd = parseTicker(hbar);
    return { source: 'Kraken', xrpUsd, hbarUsd };
  } catch (e) {
    const code = e.name === 'TimeoutError' ? 'RATE_TIMEOUT_001' : 'RATE_CONN_001';
    return { source: 'Kraken', error: e.message, code };
  }
}

/**
 * Obtiene tasa USD de Hedera Mirror con backoff y timeout de 10s
 */
async function fetchHederaMirror() {
  try {
    const r = await getWithRetry('https://mainnet-public.mirrornode.hedera.com/api/v1/network/exchangerate');
    const rate = r.data?.current_rate || r.data?.currentRate || r.data?.['current_rate'];
    const hbarUsd = rate && rate.hbar_equivalent && rate.cent_equivalent
      ? safeNumber(rate.cent_equivalent / rate.hbar_equivalent / 100)
      : null;
    return { source: 'HederaMirror', xrpUsd: null, hbarUsd };
  } catch (e) {
    const code = e.name === 'TimeoutError' ? 'RATE_TIMEOUT_001' : 'RATE_CONN_001';
    return { source: 'HederaMirror', error: e.message, code };
  }
}

function computeWeighted(values) {
  // values: [{source, xrpUsd, hbarUsd}]
  let xrpSum = 0, xrpW = 0;
  let hbarSum = 0, hbarW = 0;
  const usedSources = [];
  for (const v of values) {
    const w = WEIGHTS[v.source.toLowerCase()] || 0;
    const x = safeNumber(v.xrpUsd);
    const h = safeNumber(v.hbarUsd);
    if (x) { xrpSum += x * (w || 0); xrpW += (w || 0); usedSources.push(v.source); }
    if (h) { hbarSum += h * (w || 0); hbarW += (w || 0); if (!usedSources.includes(v.source)) usedSources.push(v.source); }
  }
  const xrpUsd = xrpW > 0 ? xrpSum / xrpW : null;
  const hbarUsd = hbarW > 0 ? hbarSum / hbarW : null;
  const rate = xrpUsd && hbarUsd ? (xrpUsd / hbarUsd) : null;
  return { xrpUsd, hbarUsd, rate, sources: usedSources };
}

function computeVolatility(sampleRates) {
  const rates = sampleRates.filter((r) => safeNumber(r) !== null);
  if (rates.length < 2) return 0;
  const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
  const variance = rates.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / rates.length;
  const stddev = Math.sqrt(variance);
  return (stddev / avg) * 100; // percent
}

function applySafetyMargin(rate, volatilityPct) {
  const marginFactor = Math.min(volatilityPct / 100, 0.05); // cap 5%
  return rate * (1 - marginFactor);
}

/**
 * Refresca la tasa consolidada desde múltiples fuentes y la cachea
 */
async function refresh({ nocache = false } = {}) {
  const fallback = parseFloat(process.env.XRPHBAR_RATE || '1');
  const results = await Promise.all([fetchBinance(), fetchCoinbase(), fetchKraken(), fetchHederaMirror()]);
  const weighted = computeWeighted(results);
  const perSourceRates = results.map(r => {
    const x = safeNumber(r.xrpUsd);
    const h = safeNumber(r.hbarUsd);
    return x && h ? (x / h) : null;
  });
  const volatility = computeVolatility(perSourceRates);
  let rate = weighted.rate || fallback;
  if (volatility > 0) rate = applySafetyMargin(rate, volatility);
  const confidence = Math.min(1, weighted.sources.length / 4);
  const now = new Date();

  if (volatility > 5) {
    logger.warn(`High volatility detected: ${volatility.toFixed(2)}%`);
  }

  const payload = {
    rate,
    xrpUsd: weighted.xrpUsd || null,
    hbarUsd: weighted.hbarUsd || null,
    formatted: `1 XRP = ${rate.toFixed(6)} HBAR`,
    timestamp: now.toISOString(),
    sources: weighted.sources,
    sourceCount: weighted.sources.length,
    volatility,
    confidence,
    cacheStatus: 'live',
  };

  await cacheService.set(CACHE_KEY, payload, TTL_SECONDS);
  try { await ExchangeRate.create({ timestamp: now, rate, sources: weighted.sources, volatility, confidence, cacheStatus: 'live' }); } catch {}
  await cacheService.increment('metrics:xrphbar_rate_updates_total:success', 1);
  return payload;
}

/**
 * Obtiene la tasa actual, respetando overrides y caché
 */
async function getRate({ includeHistory = false, hours = 24, raw = false, nocache = false } = {}) {
  const override = await cacheService.get(OVERRIDE_KEY);
  const cached = !nocache ? await cacheService.get(CACHE_KEY) : null;
  const base = cached || await refresh({ nocache });
  let data = base;
  let cacheStatus = cached ? 'cached' : base.cacheStatus;
  if (override && (!override.expiresAt || new Date(override.expiresAt) > new Date())) {
    data = { ...base, rate: override.rate, formatted: `1 XRP = ${override.rate.toFixed(6)} HBAR` };
    cacheStatus = 'override';
  }
  const ageSeconds = Math.max(0, Math.floor((Date.now() - new Date(base.timestamp).getTime()) / 1000));

  const response = {
    success: true,
    data: { ...data, ageSeconds, cacheStatus },
    metadata: {
      environment: process.env.NODE_ENV || 'development',
      lastUpdated: base.timestamp,
      updateFrequency: 'hourly',
      nextUpdate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    }
  };

  if (includeHistory) {
    const since = new Date(Date.now() - (Math.max(1, parseInt(hours, 10) || 24) * 60 * 60 * 1000));
    try {
      const hist = await ExchangeRate.find({ timestamp: { $gte: since } }).sort({ timestamp: -1 }).limit(500);
      response.history = hist;
    } catch {}
  }

  if (raw) return { base, override, cached };
  return response;
}

/**
 * Define un override temporal de tasa
 */
async function setOverride({ rate, reason, expiresAt, adminId }) {
  const old = await cacheService.get(CACHE_KEY);
  const payload = { rate: Number(rate), reason: reason || null, expiresAt: expiresAt || null, adminId, timestamp: new Date().toISOString() };
  await cacheService.set(OVERRIDE_KEY, payload, expiresAt ? Math.max(1, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)) : TTL_SECONDS);
  return { oldRate: old?.rate || null, newRate: payload.rate, adminId: adminId || null, expiresAt: payload.expiresAt, timestamp: payload.timestamp };
}

/**
 * Limpia el override de tasa
 */
async function clearOverride() {
  await cacheService.delete(OVERRIDE_KEY);
  return true;
}

/**
 * Estado de salud del oráculo y antigüedad de la tasa
 */
async function health() {
  const raw = await getRate({ raw: true });
  const sources = (raw.base?.sources || []).length;
  return { healthy: sources >= 2, sourcesActive: raw.base?.sources || [], ageSeconds: Math.max(0, Math.floor((Date.now() - new Date(raw.base?.timestamp || Date.now()).getTime()) / 1000)) };
}

/**
 * Configuración estática del oráculo
 */
function config() {
  return {
    weights: WEIGHTS,
    cacheTTLSeconds: TTL_SECONDS,
    fallbackRate: parseFloat(process.env.XRPHBAR_RATE || '1'),
    updateFrequency: 'hourly',
  };
}

/**
 * Helper: GET con retry exponencial (3 intentos)
 */
async function getWithRetry(url) {
  const delays = [500, 1000, 2000];
  let lastErr = null;
  for (let i = 0; i < 3; i++) {
    try {
      return await TimeoutManager.fetchWithTimeout(url, {}, 'externalApi');
    } catch (e) {
      lastErr = e;
      await new Promise(r => setTimeout(r, delays[i]));
    }
  }
  if (lastErr && lastErr.name === 'TimeoutError') throw createError('RATE_TIMEOUT_001', lastErr.message, 504);
  throw createError('RATE_CONN_001', (lastErr && lastErr.message) || 'Failed to fetch URL', 503);
}

module.exports = { refresh, getRate, setOverride, clearOverride, health, config };
