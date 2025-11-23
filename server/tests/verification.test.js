const request = require('supertest');
const { app } = require('../src/app');

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