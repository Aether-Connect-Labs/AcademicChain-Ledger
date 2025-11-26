process.env.NODE_ENV = 'test';
const request = require('supertest');

jest.mock('../src/models', () => {
  const store = { devs: [], tokens: [{ tokenId: '0.0.abc', tokenName: 'Test Token', universityId: 'u1' }] };
  const matches = (obj, q) => Object.keys(q).every(k => obj[k] === q[k]);
  return {
    Developer: {
      findOne: jest.fn(async (q) => store.devs.find(d => matches(d, q)) || null),
      findById: jest.fn(async (id) => store.devs.find(d => d.id === id) || null),
      create: jest.fn(async (obj) => { const d = { id: 'dev1', isActive: true, emailVerified: false, ...obj, save: async function(){ return this; } }; store.devs.push(d); return d; }),
    },
    Token: { findOne: jest.fn(async (q) => store.tokens.find(t => t.tokenId === q.tokenId) || null) },
    Credential: { create: jest.fn(async () => ({ id: 'cred1' })) },
  };
});

jest.mock('../src/services/hederaServices', () => ({
  mintAcademicCredential: jest.fn(async (tokenId, data) => ({ serialNumber: '1', transactionId: 'tx-mint' })),
  transferCredentialToStudent: jest.fn(async () => ({ transactionId: 'tx-transfer' })),
  verifyCredential: jest.fn(async (tokenId, serialNumber) => ({ valid: true, credential: { tokenId, serialNumber } })),
}));

const { app } = require('../src/app');

describe('API v1', () => {
  test('POST /api/v1/verification/verify-credential works', async () => {
    const res = await request(app)
      .post('/api/v1/verification/verify-credential')
      .send({ tokenId: '0.0.abc', serialNumber: '1' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.valid).toBe(true);
  });

  let apiKey = null;
  test('Developer register → verify → login → issue api key', async () => {
    const reg = await request(app)
      .post('/api/v1/developers/register')
      .send({ email: 'dev@example.com', name: 'Dev', password: 'secret123', plan: 'startup' });
    expect(reg.status).toBe(201);
    const token = reg.body?.data?.verificationToken;
    expect(token).toBeTruthy();

    const ver = await request(app).post('/api/v1/developers/verify-email').send({ token });
    expect(ver.status).toBe(200);

    const login = await request(app).post('/api/v1/developers/login').send({ email: 'dev@example.com', password: 'secret123' });
    expect(login.status).toBe(200);
    const jwt = login.body?.data?.token;
    expect(jwt).toBeTruthy();

    const issue = await request(app)
      .post('/api/v1/developers/api-keys/issue')
      .set('Authorization', `Bearer ${jwt}`)
      .send({});
    expect(issue.status).toBe(201);
    apiKey = issue.body?.data?.apiKey;
    expect(apiKey).toMatch(/^ak_/);
  });

  test('Issue credential with API key', async () => {
    const res = await request(app)
      .post('/api/v1/credentials/issue')
      .set('x-api-key', apiKey)
      .send({ tokenId: '0.0.abc', uniqueHash: 'hash-123', ipfsURI: 'ipfs://cid', studentName: 'Alice', degree: 'CS', recipientAccountId: '0.0.999' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.mint.serialNumber).toBe('1');
  });
});