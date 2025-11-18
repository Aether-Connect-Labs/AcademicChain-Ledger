const request = require('supertest');
const { app, startServer } = require('../src/app');
let server;

beforeAll(async () =\u003e {
  server = await startServer();
});

afterAll(done =\u003e {
  server.close(done);
});

describe('Verification API', () => {
  test('GET /api/verification/status returns operational', async () => {
    const res = await request(app)
      .get('/api/verification/status');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('operational');
  });

  test('POST /api/verification/verify-credential validates body', async () => {
    const res = await request(app)
      .post('/api/verification/verify-credential')
      .send({});
    expect([400,422]).toContain(res.status);
  });
});