process.env.NODE_ENV = 'test';
const request = require('supertest');
jest.mock('../queue/connection', () => ({
  __esModule: true,
  isConnected: () => false,
  getStats: async () => ({ status: 'disconnected' }),
}));
jest.mock('../src/middleware/partnerAuth', () => (req, res, next) => {
  req.partner = { id: 'p1', name: 'Test University', universityId: 'u1', permissions: ['verify_credential', 'mint_credential'] };
  next();
});
jest.mock('../src/services/hederaServices', () => ({
  verifyCredential: jest.fn(async (tokenId, serialNumber) => ({ valid: true, credential: { tokenId, serialNumber } })),
  mintAcademicCredential: jest.fn(async (tokenId, metadata) => ({ transactionId: 'tx-mint', serialNumber: 1 })),
  transferCredentialToStudent: jest.fn(async () => ({ transactionId: 'tx-transfer' })),
  getAccountBalance: jest.fn(async () => ({ hbars: 100 })),
}));
const { app } = require('../src/app');
const { Token } = require('../src/models');

describe('Institution (Partner API)', () => {
  beforeAll(async () => {
    // Mock token lookup
    jest.spyOn(Token, 'findOne').mockResolvedValue({ tokenId: '0.0.abc', universityId: 'u1' });
  });

  test('POST /api/partner/verify works with partnerAuth', async () => {
    const res = await request(app)
      .post('/api/partner/verify')
      .send({ tokenId: '0.0.abc', serialNumber: '1' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.valid).toBe(true);
  });

  test('POST /api/partner/institution/mint mints credential', async () => {
    const res = await request(app)
      .post('/api/partner/institution/mint')
      .send({ tokenId: '0.0.abc', uniqueHash: 'hash-1', ipfsURI: 'ipfs://cid', recipientAccountId: '0.0.999', degree: 'BSc' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.mint.serialNumber).toBe(1);
  });
});