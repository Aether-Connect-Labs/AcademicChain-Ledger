const cacheService = require('../src/services/cacheService');

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function choice(arr) { return arr[randInt(0, arr.length - 1)]; }

async function pushLatency(bucketKey, value, ttlSeconds) {
  const cur = await cacheService.get(bucketKey);
  const arr = Array.isArray(cur) ? cur : (typeof cur === 'string' ? JSON.parse(cur) : []);
  arr.push(Number(value) || 0);
  const max = 1000;
  const out = arr.length > max ? arr.slice(arr.length - max) : arr;
  await cacheService.set(bucketKey, out, ttlSeconds);
}

async function main() {
  const roles = ['admin','university','teacher','uploader'];
  const users = Array.from({ length: 50 }, (_, i) => ({ id: `user_${i+1}`, role: choice(roles) }));
  const now = Date.now();
  const events = parseInt(process.env.GENERATE_EVENTS || '500', 10);
  for (let i = 0; i < events; i++) {
    const ts = now - randInt(0, 6 * 24 * 60 * 60 * 1000);
    const hourBucket = Math.floor(ts / (60 * 60 * 1000));
    const dayBucket = Math.floor(ts / (24 * 60 * 60 * 1000));
    const user = choice(users);
    const role = user.role;
    const latency = randInt(80, 2400);
    const ok = Math.random() < 0.95;
    const statusKey = ok ? 'success' : 'failure';
    await pushLatency(`metrics:excel:latency:hour:${hourBucket}`, latency, 7 * 24 * 60 * 60);
    await pushLatency(`metrics:excel:latency:day:${dayBucket}`, latency, 30 * 24 * 60 * 60);
    await cacheService.increment(`metrics:excel:counts:hour:${hourBucket}:${statusKey}`, 1);
    await cacheService.increment(`metrics:excel:counts:day:${dayBucket}:${statusKey}`, 1);
    await cacheService.increment(`metrics:excel:role:hour:${hourBucket}:${role}:${statusKey}`, 1);
    await cacheService.increment(`metrics:excel:role:day:${dayBucket}:${role}:${statusKey}`, 1);
    await cacheService.increment(`metrics:excel:user:hour:${hourBucket}:${user.id}:${statusKey}`, 1);
    await cacheService.increment(`metrics:excel:user:day:${dayBucket}:${user.id}:${statusKey}`, 1);
    const lbKey = `metrics:excel:leaderboard:day:${dayBucket}`;
    const lb = (await cacheService.get(lbKey)) || {};
    const prev = lb[user.id] || { count: 0, role, lastSeen: new Date(ts).toISOString() };
    prev.count += 1;
    prev.role = role;
    prev.lastSeen = new Date(ts).toISOString();
    lb[user.id] = prev;
    await cacheService.set(lbKey, lb, 90 * 24 * 60 * 60);
    await cacheService.set(`metrics:excel:last_event`, { userId: user.id, role, fileName: 'generated.xlsx', fileSize: 12345, warnings: 0, securityBlocks: 0, timestamp: new Date(ts).toISOString(), success: ok, processingTime: latency }, 600);
  }
  process.stdout.write(`Generated ${events} test events.\n`);
}

main().catch(e => { process.stderr.write(String(e.message || e)); process.exit(1); });
