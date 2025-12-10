const cacheService = require('./cacheService');
const rateOracle = require('./rateOracle');

async function getPrometheusMetrics() {
  const rateResp = await rateOracle.getRate();
  const d = rateResp.data;
  const updates = await cacheService.get('metrics:xrphbar_rate_updates_total:success');
  const convXrpToHbar = await cacheService.get('metrics:xrphbar_conversions_total:XRP_TO_HBAR');
  const convHbarToXrp = await cacheService.get('metrics:xrphbar_conversions_total:HBAR_TO_XRP');
  const svcHealth = await cacheService.mget([
    'metrics:svc_health:mongodb',
    'metrics:svc_health:redis',
    'metrics:svc_health:hedera',
    'metrics:svc_health:xrpl',
    'metrics:svc_health:rate_oracle',
    'metrics:svc_latency_ms:mongodb',
    'metrics:svc_latency_ms:redis',
    'metrics:svc_latency_ms:hedera',
    'metrics:svc_latency_ms:xrpl',
    'metrics:svc_latency_ms:rate_oracle',
    'metrics:hedera_balance_hbars',
    'metrics:rate_source_status:binance',
    'metrics:rate_source_status:coinbase',
    'metrics:rate_source_status:kraken',
    'metrics:rate_source_status:hederamirror'
  ]);
  const errConn = await cacheService.mget([
    'metrics:error_total:connection:mongodb',
    'metrics:error_total:connection:redis',
    'metrics:error_total:connection:hedera',
    'metrics:error_total:connection:xrpl',
    'metrics:error_total:connection:rate_oracle'
  ]);
  const errTimeout = await cacheService.mget([
    'metrics:error_total:timeout:mongodb',
    'metrics:error_total:timeout:redis',
    'metrics:error_total:timeout:hedera',
    'metrics:error_total:timeout:xrpl',
    'metrics:error_total:timeout:rate_oracle'
  ]);
  const errValidation = await cacheService.mget([
    'metrics:error_total:validation:api'
  ]);
  const opRateFetch = await cacheService.get('metrics:operation_duration_seconds:rate_fetch');
  const opHederaTransfer = await cacheService.get('metrics:operation_duration_seconds:hedera_transfer');
  const opXrplPayment = await cacheService.get('metrics:operation_duration_seconds:xrpl_payment');

  const lines = [];
  lines.push('# HELP xrphbar_current_rate Current XRP to HBAR exchange rate');
  lines.push('# TYPE xrphbar_current_rate gauge');
  lines.push(`xrphbar_current_rate{source="${(d.sources && d.sources[0]) || 'unknown'}",cache_status="${d.cacheStatus}"} ${d.rate}`);
  lines.push('');
  lines.push('# HELP xrphbar_rate_age_seconds Age of current rate in seconds');
  lines.push('# TYPE xrphbar_rate_age_seconds gauge');
  lines.push(`xrphbar_rate_age_seconds ${d.ageSeconds}`);
  lines.push('');
  lines.push('# HELP xrphbar_rate_volatility_percent Current rate volatility percentage');
  lines.push('# TYPE xrphbar_rate_volatility_percent gauge');
  lines.push(`xrphbar_rate_volatility_percent ${d.volatility || 0}`);
  lines.push('');
  lines.push('# HELP xrphbar_rate_updates_total Total number of rate updates');
  lines.push('# TYPE xrphbar_rate_updates_total counter');
  lines.push(`xrphbar_rate_updates_total{status="success"} ${Number(updates) || 0}`);
  lines.push('');
  lines.push('# HELP xrphbar_conversions_total Total number of XRP to HBAR conversions');
  lines.push('# TYPE xrphbar_conversions_total counter');
  lines.push(`xrphbar_conversions_total{status="success",direction="XRP_TO_HBAR"} ${Number(convXrpToHbar) || 0}`);
  lines.push(`xrphbar_conversions_total{status="success",direction="HBAR_TO_XRP"} ${Number(convHbarToXrp) || 0}`);
  lines.push('');
  lines.push('# HELP xrphbar_service_health Service health status');
  lines.push('# TYPE xrphbar_service_health gauge');
  for (const s of ['mongodb','redis','hedera','xrpl','rate_oracle']) {
    lines.push(`xrphbar_service_health{service="${s}"} ${Number(svcHealth[`metrics:svc_health:${s}`] || 0)}`);
  }
  lines.push('');
  lines.push('# HELP xrphbar_service_latency_seconds Service latency in seconds');
  lines.push('# TYPE xrphbar_service_latency_seconds gauge');
  for (const s of ['mongodb','redis','hedera','xrpl','rate_oracle']) {
    const ms = Number(svcHealth[`metrics:svc_latency_ms:${s}`] || 0);
    lines.push(`xrphbar_service_latency_seconds{service="${s}"} ${(ms/1000).toFixed(6)}`);
  }
  lines.push('');
  lines.push('# HELP xrphbar_hedera_balance_hbars Hedera operator balance in HBARs');
  lines.push('# TYPE xrphbar_hedera_balance_hbars gauge');
  lines.push(`xrphbar_hedera_balance_hbars ${Number(svcHealth['metrics:hedera_balance_hbars'] || 0)}`);
  lines.push('');
  lines.push('# HELP xrphbar_rate_source_status Rate source availability');
  lines.push('# TYPE xrphbar_rate_source_status gauge');
  for (const src of ['binance','coinbase','kraken','hederamirror']) {
    lines.push(`xrphbar_rate_source_status{source="${src}"} ${Number(svcHealth[`metrics:rate_source_status:${src}`] || 0)}`);
  }
  lines.push('');
  lines.push('# HELP xrphbar_error_total Error counters');
  lines.push('# TYPE xrphbar_error_total counter');
  for (const s of ['mongodb','redis','hedera','xrpl','rate_oracle']) {
    lines.push(`xrphbar_error_total{type="connection",service="${s}"} ${Number(errConn[`metrics:error_total:connection:${s}`] || 0)}`);
    lines.push(`xrphbar_error_total{type="timeout",service="${s}"} ${Number(errTimeout[`metrics:error_total:timeout:${s}`] || 0)}`);
  }
  lines.push(`xrphbar_error_total{type="validation",service="api"} ${Number(errValidation['metrics:error_total:validation:api'] || 0)}`);
  lines.push('');
  lines.push('# HELP xrphbar_operation_duration_seconds Operation duration');
  lines.push('# TYPE xrphbar_operation_duration_seconds gauge');
  lines.push(`xrphbar_operation_duration_seconds{operation="rate_fetch"} ${Number(opRateFetch || 0)}`);
  lines.push(`xrphbar_operation_duration_seconds{operation="hedera_transfer"} ${Number(opHederaTransfer || 0)}`);
  lines.push(`xrphbar_operation_duration_seconds{operation="xrpl_payment"} ${Number(opXrplPayment || 0)}`);
  lines.push('');
  return lines.join('\n');
}

module.exports = { getPrometheusMetrics };
