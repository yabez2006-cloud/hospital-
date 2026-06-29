const request = require('supertest');
const app = require('../server');

describe('Basic server', () => {
  test('GET / should return running message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/Hospital Management API Running/);
  });
});
