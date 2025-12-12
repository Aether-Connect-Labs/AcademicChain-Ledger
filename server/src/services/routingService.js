const geoip = require('geoip-lite');
const cacheService = require('./cacheService');

const pickChain = ({ region, institution }) => {
  const strategy = String(process.env.SHARDING_STRATEGY || 'region').toLowerCase();
  const map = (process.env.SHARD_MAP || '').split(',').map(x => x.split(':')).filter(x => x.length === 2);
  const regionKey = (region || '').toLowerCase();
  const instKey = (institution || '').toLowerCase();
  const fromMap = map.find(([k]) => k.toLowerCase() === (strategy === 'institution' ? instKey : regionKey));
  if (fromMap) return fromMap[1];
  if (strategy === 'institution') {
    if (instKey.includes('hedera')) return 'hedera';
    if (instKey.includes('ripple')) return 'xrpl';
    return 'algorand';
  }
  if (regionKey.startsWith('eu')) return 'hedera';
  if (regionKey.startsWith('us')) return 'xrpl';
  return 'algorand';
};

const decideChainFromRequest = (req) => {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const geo = ip ? (geoip.lookup(ip) || {}) : {};
  const region = (geo?.country || '').toLowerCase();
  const institution = (req.user?.universityName || req.body?.institution || '').toLowerCase();
  const preferred = pickChain({ region, institution });
  try {
    const key = `routing:rr:${preferred}`;
    const idx = parseInt(cacheService.get(key) || '0', 10) || 0;
    const order = preferred === 'xrpl' ? ['xrpl','algorand'] : (preferred === 'algorand' ? ['algorand','xrpl'] : ['xrpl','algorand']);
    const picked = order[idx % order.length];
    cacheService.set(key, String((idx + 1) % order.length), 60);
    return picked;
  } catch {
    return preferred;
  }
};

module.exports = { pickChain, decideChainFromRequest };
