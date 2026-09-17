const request = require('supertest');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const Video = require('../src/models/Video');
const config = require('../src/config/env');

describe('Video API Tests', () => {
  let adminToken;
  let testVideoId;
  let testVideoPath;

  beforeAll(async () => {
    await mongoose.connect(config.mongoUri || 'mongodb://localhost:27017/cctv_test');
    
    // Login as admin
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin@123456'
      });
    adminToken = loginResponse.body.data.token;

    // Create a test video file
    const videoDir = path.join(__dirname, '../uploads/videos');
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true });
    }
    
    // Copy a sample video file for testing (you need to have a sample video)
    // For now, we'll skip file upload tests if no video is available
  });

  afterAll(async () => {
    await Video.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Video Upload', () => {
    test('should upload a video file', async () => {
      // This test requires a sample video file
      const videoPath = path.join(__dirname, 'sample.mp4');
      
      if (!fs.existsSync(videoPath)) {
        console.log('Sample video not found, skipping upload test');
        return;
      }

      const response = await request(app)
        .post('/api/videos/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', 'Test Video')
        .field('description', 'This is a test video')
        .field('isPublic', 'true')
        .attach('video', videoPath)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.video).toHaveProperty('_id');
      expect(response.body.data.video.status).toBe('processing');
      
      testVideoId = response.body.data.video._id;
      testVideoPath = response.body.data.video.path;
    });
  });

  describe('Video Retrieval', () => {
    test('should get all videos', async () => {
      const response = await request(app)
        .get('/api/videos')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.videos).toBeInstanceOf(Array);
      expect(response.body.data).toHaveProperty('pagination');
    });

    test('should get video by ID', async () => {
      if (!testVideoId) {
        console.log(' No video ID available, skipping test');
        return;
      }

      const response = await request(app)
        .get(`/api/videos/${testVideoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.video._id).toBe(testVideoId);
    });
  });

  describe('Video Statistics', () => {
    test('should get video statistics', async () => {
      const response = await request(app)
        .get('/api/videos/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('totalSizeMB');
      expect(response.body.data).toHaveProperty('byStatus');
    });
  });
});