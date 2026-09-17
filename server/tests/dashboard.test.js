const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Incident = require('../src/models/Incident');
const Alert = require('../src/models/Alert');
const User = require('../src/models/User');
const config = require('../src/config/env');

describe('Dashboard API Tests', () => {
  let adminToken;
  let operatorToken;
  let adminUser;

  beforeAll(async () => {
    await mongoose.connect(config.mongoUri || 'mongodb://localhost:27017/cctv_test');

    // Create admin user if not exists
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin@123456'
      });

    if (adminLogin.body.success) {
      adminToken = adminLogin.body.data.token;
      adminUser = adminLogin.body.data.user;
    } else {
      // Create admin user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'Admin@123456',
          role: 'admin'
        });
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'Admin@123456'
        });
      
      adminToken = loginResponse.body.data.token;
      adminUser = loginResponse.body.data.user;
    }

    // Create some test data
    await Incident.create([
      {
        title: 'Test Incident 1',
        description: 'Test description 1',
        type: 'loitering',
        severity: 'high',
        status: 'pending',
        reportedBy: adminUser._id,
        detectedAt: new Date()
      },
      {
        title: 'Test Incident 2',
        description: 'Test description 2',
        type: 'trespassing',
        severity: 'critical',
        status: 'under_review',
        reportedBy: adminUser._id,
        detectedAt: new Date(Date.now() - 86400000) // 1 day ago
      }
    ]);

    // Create test alerts
    await Alert.create([
      {
        title: 'Test Alert 1',
        message: 'Test message 1',
        priority: 'critical',
        recipients: [{ userId: adminUser._id, status: 'pending' }]
      },
      {
        title: 'Test Alert 2',
        message: 'Test message 2',
        priority: 'high',
        recipients: [{ userId: adminUser._id, status: 'read' }]
      }
    ]);
  });

  afterAll(async () => {
    await Incident.deleteMany({});
    await Alert.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Dashboard Statistics', () => {
    test('should get dashboard statistics', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data.summary).toHaveProperty('totalIncidents');
      expect(response.body.data.summary).toHaveProperty('totalVideos');
      expect(response.body.data).toHaveProperty('distribution');
      expect(response.body.data.distribution).toHaveProperty('byStatus');
      expect(response.body.data.distribution).toHaveProperty('bySeverity');
      expect(response.body.data.distribution).toHaveProperty('byType');
      expect(response.body.data).toHaveProperty('recent');
      expect(response.body.data.recent).toHaveProperty('incidents');
      expect(response.body.data.recent).toHaveProperty('alerts');
    });
  });

  describe('Real-time Monitoring', () => {
    test('should get real-time data', async () => {
      const response = await request(app)
        .get('/api/dashboard/realtime')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('activeIncidents');
      expect(response.body.data).toHaveProperty('unreadAlerts');
      expect(response.body.data).toHaveProperty('recentIncidents');
      expect(response.body.data).toHaveProperty('recentAlerts');
      expect(response.body.data).toHaveProperty('timestamp');
    });
  });

  describe('System Health', () => {
    test('should get system health (admin only)', async () => {
      const response = await request(app)
        .get('/api/dashboard/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('system');
      expect(response.body.data).toHaveProperty('users');
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('alerts');
      expect(response.body.data).toHaveProperty('performance');
    });

    test('should not allow non-admin to view health', async () => {
      // Try to login as operator
      const operatorLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'operator@example.com',
          password: 'Operator@123456'
        });

      if (!operatorLogin.body.success) {
        // Create operator if not exists
        await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Operator User',
            email: 'operator@example.com',
            password: 'Operator@123456',
            role: 'operator'
          });
        
        const login = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'operator@example.com',
            password: 'Operator@123456'
          });
        operatorToken = login.body.data.token;
      } else {
        operatorToken = operatorLogin.body.data.token;
      }

      const response = await request(app)
        .get('/api/dashboard/health')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Activity Timeline', () => {
    test('should get activity timeline', async () => {
      const response = await request(app)
        .get('/api/dashboard/timeline?days=7')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('timeline');
      expect(response.body.data).toHaveProperty('days');
      expect(response.body.data).toHaveProperty('startDate');
      expect(response.body.data).toHaveProperty('endDate');
      expect(Array.isArray(response.body.data.timeline)).toBe(true);
    });
  });

  describe('Top Performers', () => {
    test('should get top performers', async () => {
      const response = await request(app)
        .get('/api/dashboard/performers?period=week')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('period');
      expect(response.body.data).toHaveProperty('startDate');
      expect(response.body.data).toHaveProperty('topReporters');
      expect(response.body.data).toHaveProperty('topAlertHandlers');
      expect(Array.isArray(response.body.data.topReporters)).toBe(true);
      expect(Array.isArray(response.body.data.topAlertHandlers)).toBe(true);
    });
  });

  describe('Heatmap Data', () => {
    test('should get heatmap data', async () => {
      const response = await request(app)
        .get('/api/dashboard/heatmap?days=30')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('heatmapData');
      expect(response.body.data).toHaveProperty('totalLocations');
      expect(response.body.data).toHaveProperty('totalIncidents');
      expect(response.body.data).toHaveProperty('days');
      expect(Array.isArray(response.body.data.heatmapData)).toBe(true);
    });
  });
});