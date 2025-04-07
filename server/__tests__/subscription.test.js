const request = require('supertest');
const app = require('../index'); // Adjust if Express app is exported elsewhere

describe('Subscription API', () => {
  it('responds to GET /api/subscription/plans with 200', async () => {
    const res = await request(app).get('/api/subscription/plans');
    expect(res.statusCode).toBe(200);
  });
});