const cacheService = require('../src/services/cacheService');

function percentiles(numbers) {
  const arr = (numbers || []).map(n => Number(n)).filter(n => Number.isFinite(n)).sort((a,b)=>a-b);
  if (!arr.length) return { p50: 0, p95: 0, p99: 0 };
  const q = (p) => arr[Math.min(arr.length - 1, Math.floor((p/100) * arr.length))];
  return { p50: q(50), p95: q(95), p99: q(99) };
}

async function aggregateDay(dayBucket) {
  let latencies = [];
  const startHour = dayBucket * 24;
  for (let h = 0; h < 24; h++) {
    const hb = startHour + h;
    const lat = await cacheService.get(`metrics:excel:latency:hour:${hb}`) || [];
    const arr = Array.isArray(lat) ? lat : (typeof lat === 'string' ? JSON.parse(lat) : []);
    latencies = latencies.concat(arr);
  }
  const p = percentiles(latencies);
  await cacheService.set(`metrics:excel:latency:day:${dayBucket}`, latencies.slice(-1000), 30 * 24 * 60 * 60);
  const s = Number(await cacheService.get(`metrics:excel:counts:day:${dayBucket}:success`) || 0);
  const f = Number(await cacheService.get(`metrics:excel:counts:day:${dayBucket}:failure`) || 0);
  for (const role of ['admin','university','teacher','uploader']) {
    const rs = Number(await cacheService.get(`metrics:excel:role:day:${dayBucket}:${role}:success`) || 0);
    const rf = Number(await cacheService.get(`metrics:excel:role:day:${dayBucket}:${role}:failure`) || 0);
    await cacheService.set(`metrics:excel:daily:${dayBucket}:role:${role}`, { success: rs, failure: rf }, 90 * 24 * 60 * 60);
  }
  await cacheService.set(`metrics:excel:daily:${dayBucket}:summary`, { totals: { success: s, failure: f }, percentiles: p }, 90 * 24 * 60 * 60);
}

async function cleanupOld(retainDays = 90) {
  const now = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  const cutoffHour = ((now - retainDays) * 24);
  try { await cacheService.deletePattern('metrics:excel:latency:hour:*'); } catch {}
  try { await cacheService.deletePattern('metrics:excel:counts:hour:*'); } catch {}
  // Day keys are TTL-based; optional explicit cleanup can be added if needed.
}

(async () => {
  const nowDay = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  await aggregateDay(nowDay - 1);
  await cleanupOld(90);
  process.stdout.write('Daily aggregation completed.\n');
})();
