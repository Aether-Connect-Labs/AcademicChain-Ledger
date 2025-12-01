const request = require('supertest');
const jwt = require('jsonwebtoken');
process.env.NODE_ENV = 'test';
process.env.DISABLE_MONGO = '1';

const mockUser = { id: 'u1', email: 'univ.demo@acme.edu', name: 'Universidad Demo', role: 'university', hederaAccountId: '0.0.123', isActive: true };
let mockTxRecord = null;
const createdCreds = [];

jest.mock('../src/services/hederaServices', () => ({
  requestCredentialOnChain: jest.fn(async () => ({ success: true, transactionId: 'onchain-tx' })),
  mintAcademicCredential: jest.fn(async (tokenId, data) => ({ serialNumber: String(createdCreds.length + 1), transactionId: 'mint-tx' })),
  executeSignedTransaction: jest.fn(async () => ({ receipt: { status: { toString: () => 'SUCCESS' } }, transactionId: 'pay-tx' })),
  getAccountBalance: jest.fn(async () => ({ hbars: '100.0', tokens: '{}' })),
  transferCredentialToStudent: jest.fn(async () => ({ transactionId: 'transfer-tx' })),
}));

jest.mock('../src/services/xrpService', () => ({
  isEnabled: () => true,
  connect: jest.fn(async () => {}),
  anchor: jest.fn(async () => ({ xrpTxHash: 'ABC123' })),
}));

jest.mock('../src/models', () => ({
  User: { findById: jest.fn(async () => mockUser), findOne: jest.fn(async () => mockUser) },
  Token: { findOne: jest.fn(async () => ({ tokenId: '0.0.999', tokenSymbol: 'RND', universityId: 'u1' })) },
  Transaction: {
    create: jest.fn(async (obj) => { mockTxRecord = { id: 'tx1', universityId: obj.universityId, status: obj.status, credentialData: obj.credentialData, save: jest.fn(async function() { return this; }) }; return mockTxRecord; }),
    findById: jest.fn(async () => mockTxRecord),
  },
  Credential: {
    create: jest.fn(async (obj) => { const doc = { ...obj, createdAt: new Date().toISOString(), toObject: function() { return { ...this }; } }; createdCreds.push(doc); return doc; }),
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
const makeToken = () => jwt.sign({ userId: mockUser.id, role: 'university' }, process.env.JWT_SECRET || 'test-secret');

describe('Random issuance flow', () => {
  test('issues multiple credentials with random names', async () => {
    const token = makeToken();
    const names = ['Ana Pérez','Luis Gómez','María Torres','Carlos Ruiz','Sofía López'];
    for (const name of names) {
      const res = await request(app)
        .post('/api/universities/issue-credential')
        .set('Authorization', `Bearer ${token}`)
        .send({ tokenId: '0.0.999', uniqueHash: `rnd-${Math.random().toString(36).slice(2)}`, ipfsURI: 'ipfs://demo', degree: 'Grado Demo', studentName: name, graduationDate: '2025-12-01' });
      expect(res.status).toBe(201);
      expect(res.body?.data?.nftId).toMatch(/^0\.0\.999-\d+$/);
    }

    const list = await request(app)
      .get('/api/universities/credentials?page=1&limit=10&sort=desc')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    const creds = list.body?.data?.credentials || [];
    expect(Array.isArray(creds)).toBe(true);
    expect(creds.length).toBeGreaterThanOrEqual(names.length);
  });
});
