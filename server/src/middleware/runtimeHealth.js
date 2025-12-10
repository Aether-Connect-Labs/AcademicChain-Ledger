const cacheService = require('../services/cacheService');
const rateOracle = require('../services/rateOracle');
const hederaService = require('../services/hederaServices');
const xrpService = require('../services/xrpService');
const { isConnected: isMongoConnected } = require('../config/database');
const { isConnected: isRedisConnected } = require('../../queue/connection');
const logger = require('../utils/logger');

class RuntimeHealthMonitor {
  constructor({ io, intervalMs, emitIntervalMs, degradeThresholdMs } = {}) {
    this.io = io;
    this.intervalMs = intervalMs || parseInt(process.env.RUNTIME_MONITOR_INTERVAL_MS || '30000', 10);
    this.emitIntervalMs = emitIntervalMs || parseInt(process.env.RUNTIME_HEALTH_EMIT_INTERVAL_MS || '60000', 10);
    this.degradeThresholdMs = degradeThresholdMs || parseInt(process.env.RUNTIME_DEGRADE_THRESHOLD_MS || '5000', 10);
    this.timers = { check: null, emit: null };
    this.last = { snapshot: null, alerts: [] };
  }

  async start() {
    await this.checkAllServices();
    if (this.timers.check) clearInterval(this.timers.check);
    if (this.timers.emit) clearInterval(this.timers.emit);
    this.timers.check = setInterval(() => { this.checkAllServices().catch(() => {}); }, this.intervalMs);
    this.timers.emit = setInterval(() => { this.emitHealthUpdate().catch(() => {}); }, this.emitIntervalMs);
  }

  stop() {
    if (this.timers.check) clearInterval(this.timers.check);
    if (this.timers.emit) clearInterval(this.timers.emit);
    this.timers = { check: null, emit: null };
  }

  async emitHealthUpdate() {
    const snapshot = this.last.snapshot || await this.buildSnapshot();
    this.last.snapshot = snapshot;
    try { if (this.io && typeof this.io.emit === 'function') this.io.emit('health:update', snapshot); } catch {}
  }

  async checkAllServices() {
    const svc = {};
    const now = Date.now();
    const mongoLatency = await this.measure(async () => isMongoConnected(), 'mongodb');
    const redisLatency = await this.measure(async () => isRedisConnected(), 'redis');
    const hederaLatency = await this.measure(async () => {
      try { await hederaService.connect(); } catch {}
      return hederaService.isEnabled();
    }, 'hedera');
    const xrplLatency = await this.measure(async () => {
      try { await xrpService.connect(); } catch {}
      return xrpService.isEnabled();
    }, 'xrpl');
    const rateLatency = await this.measure(async () => {
      const nocache = String(process.env.RUNTIME_RATE_CHECK_NOCACHE || '0') === '1';
      const r = await rateOracle.getRate({ nocache });
      return !!r?.data?.rate;
    }, 'rate_oracle');

    svc.mongodb = { healthy: isMongoConnected(), latencyMs: mongoLatency.latencyMs, timestamp: new Date(now).toISOString() };
    svc.redis = { healthy: isRedisConnected(), latencyMs: redisLatency.latencyMs, timestamp: new Date(now).toISOString() };
    svc.hedera = { healthy: hederaService.isEnabled(), latencyMs: hederaLatency.latencyMs, timestamp: new Date(now).toISOString() };
    svc.xrpl = { healthy: xrpService.isEnabled(), latencyMs: xrplLatency.latencyMs, timestamp: new Date(now).toISOString() };
    const rateHealth = await rateOracle.health();
    svc.rate_oracle = { healthy: !!rateHealth.healthy, latencyMs: rateLatency.latencyMs, ageSeconds: rateHealth.ageSeconds, sources: rateHealth.sourcesActive, timestamp: new Date(now).toISOString() };

    await cacheService.mset({
      'metrics:svc_health:mongodb': svc.mongodb.healthy ? 1 : 0,
      'metrics:svc_health:redis': svc.redis.healthy ? 1 : 0,
      'metrics:svc_health:hedera': svc.hedera.healthy ? 1 : 0,
      'metrics:svc_health:xrpl': svc.xrpl.healthy ? 1 : 0,
      'metrics:svc_health:rate_oracle': svc.rate_oracle.healthy ? 1 : 0,
      'metrics:svc_latency_ms:mongodb': svc.mongodb.latencyMs,
      'metrics:svc_latency_ms:redis': svc.redis.latencyMs,
      'metrics:svc_latency_ms:hedera': svc.hedera.latencyMs,
      'metrics:svc_latency_ms:xrpl': svc.xrpl.latencyMs,
      'metrics:svc_latency_ms:rate_oracle': svc.rate_oracle.latencyMs,
      'metrics:operation_duration_seconds:rate_fetch': Number((rateLatency.latencyMs/1000).toFixed(6))
    }, 180);

    const degrade = [];
    for (const [name, data] of Object.entries(svc)) {
      const isDegraded = !data.healthy || (Number(data.latencyMs || 0) > this.degradeThresholdMs);
      if (isDegraded) degrade.push({ name, data });
    }

    for (const src of ['Binance', 'Coinbase', 'Kraken', 'HederaMirror']) {
      const active = Array.isArray(svc.rate_oracle.sources) && svc.rate_oracle.sources.includes(src);
      const key = src.toLowerCase();
      await cacheService.set(`metrics:rate_source_status:${key}`, active ? 1 : 0, 300);
    }

    if (svc.hedera.healthy) {
      try {
        const bal = await hederaService.getAccountBalance(process.env.HEDERA_ACCOUNT_ID);
        const h = parseFloat(String(bal.hbars || '0')) || 0;
        await cacheService.set('metrics:hedera_balance_hbars', h, 180);
      } catch (e) {
        await cacheService.increment('metrics:error_total:connection:hedera', 1);
      }
    }

    const snapshot = await this.buildSnapshot(svc);
    this.last.snapshot = snapshot;

    if (degrade.length) {
      for (const d of degrade) {
        const payload = { timestamp: new Date().toISOString(), code: d.name === 'rate_oracle' ? 'RATE_001' : 'SVC_001', service: d.name, message: 'Service degraded', severity: 'warning', metadata: { latencyMs: d.data.latencyMs, healthy: d.data.healthy } };
        this.last.alerts.unshift(payload);
        this.last.alerts = this.last.alerts.slice(0, 20);
        try { await cacheService.set('alerts:system:list', this.last.alerts, 3600); } catch {}
        try { if (this.io && typeof this.io.emit === 'function') this.io.emit('system:alert', payload); } catch {}
        logger.warn('Service degraded', payload);
      }
    }
  }

  async buildSnapshot(existing) {
    const svc = existing || {
      mongodb: { healthy: isMongoConnected(), latencyMs: await this.latencyOf(() => isMongoConnected()) },
      redis: { healthy: isRedisConnected(), latencyMs: await this.latencyOf(() => isRedisConnected()) },
      hedera: { healthy: hederaService.isEnabled(), latencyMs: await this.latencyOf(() => hederaService.isEnabled()) },
      xrpl: { healthy: xrpService.isEnabled(), latencyMs: await this.latencyOf(() => xrpService.isEnabled()) },
      rate_oracle: { healthy: (await rateOracle.health()).healthy, latencyMs: await this.latencyOf(() => rateOracle.getRate()), sources: (await rateOracle.health()).sourcesActive }
    };
    const alerts = await cacheService.get('alerts:system:list') || [];
    const recommendations = [];
    for (const [name, data] of Object.entries(svc)) {
      if (!data.healthy) recommendations.push(`check ${name} connectivity`);
      else if (Number(data.latencyMs || 0) > this.degradeThresholdMs) recommendations.push(`increase ${name} timeout or investigate latency`);
    }
    return { timestamp: new Date().toISOString(), services: svc, alerts, recommendations };
  }

  async latencyOf(fn) {
    const t0 = Date.now();
    try { await fn(); } catch {}
    return Date.now() - t0;
  }

  async measure(fn, serviceName = 'generic') {
    const t0 = Date.now();
    let ok = false;
    try { ok = !!(await fn()); } catch (e) { await cacheService.increment(`metrics:error_total:connection:${serviceName}`, 1); }
    const dt = Date.now() - t0;
    if (dt > this.degradeThresholdMs) await cacheService.increment(`metrics:error_total:timeout:${serviceName}`, 1);
    return { ok, latencyMs: dt };
  }
}

let monitorInstance = null;

function getRuntimeHealthMonitor(io) {
  if (!monitorInstance) monitorInstance = new RuntimeHealthMonitor({ io });
  return monitorInstance;
}

module.exports = { RuntimeHealthMonitor, getRuntimeHealthMonitor };
