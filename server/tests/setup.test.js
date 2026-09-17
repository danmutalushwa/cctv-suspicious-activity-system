const request = require('supertest');
const app = require('../src/app');

describe('Basic Server Tests', () => {
  test('GET / should return welcome message', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('name');
    expect(response.body.data).toHaveProperty('version');
  });

  test('GET /api/health should return server health', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('status', 'OK');
  });

  test('GET /api/test should return test success', async () => {
    const response = await request(app)
      .get('/api/test')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('message', 'API is working!');
  });

  test('GET /nonexistent should return 404', async () => {
    const response = await request(app)
      .get('/nonexistent')
      .expect(404);
    
    expect(response.body.success).toBe(false);
  });
});