const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Incident = require('../src/models/Incident');

describe('Incident API Tests', () => {
  let adminToken;
  let operatorToken;
  let testIncidentId;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cctv_test');
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Incident.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up incidents before each test
    await Incident.deleteMany({});
  });

  describe('Incident CRUD Operations', () => {
    test('should create an incident', async () => {
      // First, login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'Admin@123456'
        });

      adminToken = loginResponse.body.data.token;

      const incidentData = {
        title: 'Suspicious Person Detected',
        description: 'A person was detected loitering near the main entrance at 2:30 AM',
        type: 'loitering',
        severity: 'medium',
        location: {
          address: '123 Main Street, City',
          coordinates: [77.5946, 12.9716],
          cameraId: null
        },
        confidence: 0.85
      };

      const response = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(incidentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.incident).toHaveProperty('incidentNumber');
      expect(response.body.data.incident.title).toBe(incidentData.title);
      expect(response.body.data.incident.status).toBe('pending');

      testIncidentId = response.body.data.incident._id;
    });

    test('should get all incidents', async () => {
      const response = await request(app)
        .get('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.incidents).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toHaveProperty('total');
    });

    test('should get incident by ID', async () => {
      const response = await request(app)
        .get(`/api/incidents/${testIncidentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.incident._id).toBe(testIncidentId);
    });

    test('should update incident', async () => {
      const updateData = {
        title: 'Updated Suspicious Person Detected',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/incidents/${testIncidentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.incident.title).toBe(updateData.title);
      expect(response.body.data.incident.description).toBe(updateData.description);
    });

    test('should assign incident to operator', async () => {
      // Create an operator user first
      const operatorUser = await User.create({
        name: 'Test Operator',
        email: 'operator_test@example.com',
        password: 'Operator@123456',
        role: 'operator'
      });

      const response = await request(app)
        .post(`/api/incidents/${testIncidentId}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assignedTo: operatorUser._id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.incident.status).toBe('under_review');
      expect(response.body.data.incident.assignedTo).toBe(operatorUser._id.toString());
    });
  });

  describe('Incident Notes', () => {
    test('should add note to incident', async () => {
      const noteData = {
        text: 'This is a test note for the incident',
        isInternal: false
      };

      const response = await request(app)
        .post(`/api/incidents/${testIncidentId}/notes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(noteData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.incident.notes).toBeInstanceOf(Array);
      expect(response.body.data.incident.notes[0].text).toBe(noteData.text);
    });
  });

  describe('Incident Statistics', () => {
    test('should get incident statistics', async () => {
      const response = await request(app)
        .get('/api/incidents/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('byStatus');
      expect(response.body.data).toHaveProperty('byType');
      expect(response.body.data).toHaveProperty('bySeverity');
    });
  });
});