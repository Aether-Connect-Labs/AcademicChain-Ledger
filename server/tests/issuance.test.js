process.env.NODE_ENV = 'test';
const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/services/hederaServices', () => ({
  requestCredentialOnChain: jest.fn(async () => ({ success: true, transactionId: 'onchain-tx' })),
  mintAcademicCredential: jest.fn(async (tokenId, data) => ({ serialNumber: '1', transactionId: 'mint-tx' })),
  executeSignedTransaction: jest.fn(async () => ({ receipt: { status: { toString: () => 'SUCCESS' } }, transactionId: 'pay-tx' })),
  getAccountBalance: jest.fn(async () => ({ hbars: '100.0', tokens: '{}' })),
  transferCredentialToStudent: jest.fn(async () => ({ transactionId: 'transfer-tx' })),
}));
jest.mock('../src/services/xrpService', () => ({
  isEnabled: () => false,
  connect: jest.fn(async () => {}),
  anchor: jest.fn(async () => ({})),
}));

const mockUser = { id: 'u1', role: 'university', universityName: 'Test University', hederaAccountId: '0.0.7174400', email: 'uni@test.com' };
let mockTxRecord = null;
let createdCreds = [];

jest.mock('../src/models', () => ({
  User: { findById: jest.fn(async () => mockUser), findOne: jest.fn(async () => mockUser) },
  Token: { findOne: jest.fn(async () => ({ tokenId: '0.0.123456', tokenSymbol: 'TEST', universityId: 'u1' })) },
  Transaction: {
    create: jest.fn(async (obj) => { mockTxRecord = { id: 'tx1', universityId: obj.universityId, status: obj.status, credentialData: obj.credentialData, save: jest.fn(async function() { return this; }) }; return mockTxRecord; }),
    findById: jest.fn(async () => mockTxRecord),
  },
  Credential: {
    create: jest.fn(async (obj) => { 
      const doc = { ...obj, createdAt: new Date().toISOString(), toObject: function() { return { ...this }; } };
      createdCreds.push(doc); 
      return doc; 
    }),
    find: jest.fn((query) => ({
      sort: jest.fn(() => ({
        skip: jest.fn((s) => ({
          limit: jest.fn((n) => createdCreds
            .filter(c => (query.universityId ? c.universityId === query.universityId : true))
            .slice(s, s + n))
        }))
      }))
    })),
    countDocuments: jest.fn(async (query) => createdCreds.filter(c => (query.universityId ? c.universityId === query.universityId : true)).length),
  },
}));

const { app } = require('../src/app');

const makeToken = () => jwt.sign({ userId: mockUser.id }, process.env.JWT_SECRET || 'test-secret');

describe('Credential issuance', () => {
  test('prepare-issuance returns transactionId without payment', async () => {
    delete process.env.PAYMENT_TOKEN_ID;
    const token = makeToken();
    const res = await request(app)
      .post('/api/universities/prepare-issuance')
      .set('Authorization', `Bearer ${token}`)
      .send({ tokenId: '0.0.123456', uniqueHash: 'abc123', ipfsURI: 'ipfs://cid' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const txId = res.body.data?.transactionId || res.body.transactionId;
    expect(txId).toBe('tx1');
    expect(mockTxRecord.status).toBe('PENDING_ISSUANCE');
  });

  test('execute-issuance mints credential successfully', async () => {
    const token = makeToken();
    mockTxRecord.status = 'PENDING_ISSUANCE';
    mockTxRecord.credentialData = { tokenId: '0.0.123456', uniqueHash: 'abc123', ipfsURI: 'ipfs://cid', recipientAccountId: '0.0.123' };
    const res = await request(app)
      .post('/api/universities/execute-issuance')
      .set('Authorization', `Bearer ${token}`)
      .send({ transactionId: 'tx1' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.mint.serialNumber).toBe('1');
  });

  test('list issued credentials for university', async () => {
    const token = makeToken();
    const res = await request(app)
      .get('/api/universities/credentials')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const list = res.body.data.credentials;
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list[0].tokenId).toBe('0.0.123456');
  });
});