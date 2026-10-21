const request = require('supertest');
const app = require('../server');

describe('Events API', () => {

  test('GET /api/events should return all events', async () => {
    const response = await request(app).get('/api/events');

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

});