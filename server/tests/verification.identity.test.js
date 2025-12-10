process.env.NODE_ENV = 'test';
const request = require('supertest');
jest.mock('../src/services/hederaServices', () => ({
  verifyCredential: jest.fn(async (tokenId, serialNumber) => ({ valid: true, credential: { tokenId, serialNumber, ownerAccountId: '0.0.7174400' } })),
  verifySignature: jest.fn(async () => true),
}));
const { app } = require('../src/app');

describe('Identity verification', () => {
  test('verify-ownership returns isOwner true when matches', async () => {
    const res = await request(app).post('/api/verification/verify-ownership?mock=1').send({ tokenId: '0.0.x', serialNumber: '1', accountId: '0.0.7174400' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isOwner).toBe(true);
  });

  test('verify-holder-signature returns verified true', async () => {
    const res = await request(app).post('/api/verification/verify-holder-signature?mock=1').send({ accountId: '0.0.7174400', message: 'nonce-123', signature: 'c2ln' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.verified).toBe(true);
  });
});
