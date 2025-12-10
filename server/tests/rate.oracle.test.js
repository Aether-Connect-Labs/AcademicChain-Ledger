process.env.NODE_ENV = 'test';
const axios = require('axios');
jest.mock('axios');

const cacheService = require('../src/services/cacheService');
jest.spyOn(cacheService, 'set').mockResolvedValue(true);
jest.spyOn(cacheService, 'get').mockResolvedValue(null);
jest.spyOn(cacheService, 'increment').mockResolvedValue(1);

const rateOracle = require('../src/services/rateOracle');

describe('Rate Oracle', () => {
  test('refresh computes rate and caches', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('binance')) return Promise.resolve({ data: { price: url.includes('XRP') ? '0.6' : '0.12' } });
      if (url.includes('coinbase')) return Promise.resolve({ data: { data: { amount: url.includes('XRP') ? '0.61' : '0.11' } } });
      if (url.includes('kraken')) return Promise.resolve({ data: { result: { XXRPZUSD: { c: ['0.59'] }, HBARUSD: { c: ['0.10'] } } } });
      if (url.includes('mirrornode')) return Promise.resolve({ data: { current_rate: { hbar_equivalent: 100, cent_equivalent: 1200 } } });
      return Promise.reject(new Error('Unknown URL'));
    });
    const r = await rateOracle.refresh();
    expect(r.rate).toBeGreaterThan(0);
    expect(Array.isArray(r.sources)).toBe(true);
  }, 15000);

  test('override sets manual rate', async () => {
    const res = await rateOracle.setOverride({ rate: 123.456, reason: 'test', adminId: 'admin' });
    expect(res.newRate).toBe(123.456);
  }, 10000);
});
