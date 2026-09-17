const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Alert = require('../src/models/Alert');
const config = require('../src/config/env');

async function testPermissionsAndValidations() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    // Login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin@123456'
      });
    
    const adminToken = adminLogin.body.data.token;
    console.log('Admin logged in');

    // Login as operator
    let operatorToken;
    try {
      const operatorLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'operator@example.com',
          password: 'Operator@123456'
        });
      operatorToken = operatorLogin.body.data.token;
      console.log('Operator logged in');
    } catch (error) {
      console.log('Operator not found, creating one...');
      // Create operator user
      await User.create({
        name: 'Test Operator',
        email: 'operator_test@example.com',
        password: 'Operator@123456',
        role: 'operator'
      });
      
      const operatorLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'operator_test@example.com',
          password: 'Operator@123456'
        });
      operatorToken = operatorLogin.body.data.token;
      console.log('Operator created and logged in');
    }

    console.log('\nTesting Validations:');

    // Test validation - missing title
    const response1 = await request(app)
      .post('/api/alerts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        message: 'Test message without title'
      });

    console.log(`Missing title: ${response1.body.success ? 'FAILED' : 'PASSED'}`);
    console.log(`   Status: ${response1.status}, Message: ${response1.body.message}`);

    // Test validation - missing message
    const response2 = await request(app)
      .post('/api/alerts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Test title without message'
      });

    console.log(`Missing message: ${response2.body.success ? 'FAILED' : 'PASSED'}`);
    console.log(`   Status: ${response2.status}, Message: ${response2.body.message}`);

    // Test validation - valid alert
    const response3 = await request(app)
      .post('/api/alerts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Valid Test Alert',
        message: 'This is a valid test alert message',
        priority: 'high'
      });

    console.log(`Valid alert: ${response3.body.success ? 'PASSED' : 'FAILED'}`);
    if (response3.body.success) {
      console.log(`   Alert ID: ${response3.body.data.alert._id}`);
    }

    console.log('\nTesting Permissions:');

    // Test admin can create alert
    const response4 = await request(app)
      .post('/api/alerts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Admin Test Alert',
        message: 'Testing admin permissions',
        priority: 'medium'
      });

    console.log(`Admin can create alert: ${response4.body.success ? 'PASSED' : 'FAILED'}`);

    // Test operator can create alert
    const response5 = await request(app)
      .post('/api/alerts')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        title: 'Operator Test Alert',
        message: 'Testing operator permissions',
        priority: 'low'
      });

    console.log(`Operator can create alert: ${response5.body.success ? 'PASSED' : 'FAILED'}`);

    // Test admin can delete alert
    if (response3.body.success) {
      const alertId = response3.body.data.alert._id;
      const response6 = await request(app)
        .delete(`/api/alerts/${alertId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      console.log(`Admin can delete alert: ${response6.body.success ? 'PASSED' : 'FAILED'}`);
    }

    // Test operator cannot delete alert (if we have an alert to delete)
    if (response5.body.success) {
      const alertId = response5.body.data.alert._id;
      const response7 = await request(app)
        .delete(`/api/alerts/${alertId}`)
        .set('Authorization', `Bearer ${operatorToken}`);

      console.log(`Operator cannot delete alert: ${response7.status === 403 ? 'PASSED' : 'FAILED'}`);
      console.log(`   Status: ${response7.status}, Message: ${response7.body.message}`);
    }

    await mongoose.connection.close();
    console.log('\nAll tests complete');
  } catch (error) {
    console.error('Test error:', error);
  }
}

testPermissionsAndValidations();