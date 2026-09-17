const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Alert = require('../src/models/Alert');

describe('Alert API Tests', () => {
  let adminToken;
  let adminUser;
  let operatorToken;
  let testAlertId;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cctv_test');
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Alert.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up alerts before each test
    await Alert.deleteMany({});
  });

  describe('Alert Creation', () => {
    test('should create an alert', async () => {
      // Login as admin
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'Admin@123456'
        });

      adminToken = loginResponse.body.data.token;
      adminUser = loginResponse.body.data.user;

      const alertData = {
        title: 'Security Alert: Suspicious Activity',
        message: 'A suspicious person has been detected near the main entrance',
        priority: 'high',
        type: 'in_app',
        channels: ['in_app', 'socket']
      };

      const response = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(alertData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alert).toHaveProperty('_id');
      expect(response.body.data.alert.title).toBe(alertData.title);
      expect(response.body.data.alert.priority).toBe(alertData.priority);

      testAlertId = response.body.data.alert._id;
    });

    test('should not create alert without authentication', async () => {
      const response = await request(app)
        .post('/api/alerts')
        .send({
          title: 'Test Alert',
          message: 'Test message'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Alert Retrieval', () => {
    test('should get alerts for current user', async () => {
      const response = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts).toBeInstanceOf(Array);
      expect(response.body.data).toHaveProperty('unreadCount');
      expect(response.body.data).toHaveProperty('pagination');
    });

    test('should get alert by ID', async () => {
      const response = await request(app)
        .get(`/api/alerts/${testAlertId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alert._id).toBe(testAlertId);
    });
  });

  describe('Alert Actions', () => {
    test('should mark alert as read', async () => {
      const response = await request(app)
        .post(`/api/alerts/${testAlertId}/read`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('marked as read');
    });

    test('should mark all alerts as read', async () => {
      const response = await request(app)
        .post('/api/alerts/mark-all-read')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should acknowledge alert', async () => {
      const response = await request(app)
        .post(`/api/alerts/${testAlertId}/acknowledge`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alert.isAcknowledged).toBe(true);
      expect(response.body.data.alert.acknowledgedBy).toBe(adminUser._id);
    });
  });

  describe('Alert Statistics', () => {
    test('should get alert statistics', async () => {
      const response = await request(app)
        .get('/api/alerts/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('unreadCount');
      expect(response.body.data).toHaveProperty('byPriority');
      expect(response.body.data).toHaveProperty('byType');
      expect(response.body.data).toHaveProperty('recent');
    });
  });
});