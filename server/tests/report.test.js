const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Report = require('../src/models/Report');
const config = require('../src/config/env');

describe('Report API Tests', () => {
  let adminToken;
  let testReportId;

  beforeAll(async () => {
    await mongoose.connect(config.mongoUri || 'mongodb://localhost:27017/cctv_test');
    
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin@123456'
      });
    adminToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    await Report.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Report Creation', () => {
    test('should create a report', async () => {
      const reportData = {
        title: 'Test Incident Report',
        description: 'Testing report generation',
        type: 'incident_summary',
        format: 'pdf',
        parameters: {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          filters: {
            severity: ['high', 'critical'],
            includeDetails: true,
            includeCharts: true
          },
          grouping: 'day'
        }
      };

      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(reportData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.report).toHaveProperty('_id');
      expect(response.body.data.report.status).toBe('pending');
      
      testReportId = response.body.data.report._id;
    });

    test('should not create report with invalid date range', async () => {
      const reportData = {
        title: 'Invalid Date Range Report',
        type: 'incident_summary',
        format: 'pdf',
        parameters: {
          startDate: new Date(),
          endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // End before start
          grouping: 'day'
        }
      };

      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(reportData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Report Retrieval', () => {
    test('should get all reports', async () => {
      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reports).toBeInstanceOf(Array);
      expect(response.body.data).toHaveProperty('pagination');
    });

    test('should get report by ID', async () => {
      if (!testReportId) {
        console.log('No report ID available, skipping test');
        return;
      }

      const response = await request(app)
        .get(`/api/reports/${testReportId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.report._id).toBe(testReportId);
    });
  });

  describe('Report Statistics', () => {
    test('should get report statistics', async () => {
      const response = await request(app)
        .get('/api/reports/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('byType');
      expect(response.body.data).toHaveProperty('byStatus');
      expect(response.body.data).toHaveProperty('byFormat');
    });
  });
});