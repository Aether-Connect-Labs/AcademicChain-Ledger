process.env.NODE_ENV = 'test';
jest.mock('../queue/connection', () => ({
  __esModule: true,
  default: {},
  status: 'disconnected',
  isConnected: () => false,
  getStats: async () => ({ status: 'disconnected' }),
  connect: jest.fn(),
  on: jest.fn(),
  pipeline: () => ({ setex: jest.fn(), set: jest.fn(), exec: jest.fn() }),
  get: jest.fn(async () => null),
  set: jest.fn(async () => true),
  setex: jest.fn(async () => true),
  del: jest.fn(async () => 1),
  incrby: jest.fn(async () => 1),
  mget: jest.fn(async () => []),
  info: jest.fn(async () => ''),
}));
jest.mock('../queue/issuanceQueue', () => ({
  issuanceQueue: { close: async () => {} },
}));
jest.mock('../src/workers', () => ({
  initializeWorkers: () => {},
}));
const request = require('supertest');
jest.mock('../src/services/hederaServices', () => ({
  verifyCredential: jest.fn(async (tokenId, serialNumber) => ({
    valid: true,
    onChain: true,
    credential: {
      tokenId,
      serialNumber,
      ownerAccountId: '0.0.999',
      metadata: { attributes: [{ trait_type: 'University', value: 'Test University' }] },
    },
  })),
  getAccountBalance: jest.fn(async () => ({ hbars: 100 })),
}));
jest.mock('../src/services/xrpService', () => ({
  isEnabled: () => false,
  connect: jest.fn(async () => {}),
  anchor: jest.fn(async () => ({})),
}));
jest.mock('../src/models', () => ({
  User: { findOne: jest.fn(async () => null) },
  Credential: { findOne: jest.fn(async () => null) },
}));

const { app } = require('../src/app');

describe('B2B Verification API', () => {
  test('POST /api/verification/verify-credential returns valid', async () => {
    const res = await request(app)
      .post('/api/verification/verify-credential')
      .send({ tokenId: '0.0.123', serialNumber: '1' })
      .set('Accept', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.credential.tokenId).toBe('0.0.123');
  });

  test('POST /api/verification/batch-verify returns summary', async () => {
    const res = await request(app)
      .post('/api/verification/batch-verify')
      .send({ credentials: [
        { tokenId: '0.0.123', serialNumber: '1' },
        { tokenId: '0.0.456', serialNumber: '2' },
      ]});
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.total).toBe(2);
    expect(res.body.data.summary.successful).toBe(2);
  });

  test('GET /api/verification/verify/:tokenId/:serialNumber returns HTML with Accept text/html', async () => {
    const res = await request(app)
      .get('/api/verification/verify/0.0.123/1')
      .set('Accept', 'text/html');
    expect(res.status).toBe(200);
    expect(res.text.includes('AcademicChain Ledger')).toBe(true);
  });
});