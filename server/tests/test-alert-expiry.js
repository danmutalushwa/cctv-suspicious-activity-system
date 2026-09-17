const mongoose = require('mongoose');
const Alert = require('../src/models/Alert');
const User = require('../src/models/User');
const config = require('../src/config/env');

async function testAlertExpiry() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('📁 Connected to MongoDB');

    // Find a test user
    const user = await User.findOne({ email: 'admin@example.com' });
    if (!user) {
      console.log('❌ Test user not found');
      return;
    }

    // Create a test alert with short expiry (1 minute)
    const alert = await Alert.create({
      title: 'Test Alert - Should Expire',
      message: 'This alert will expire in 1 minute',
      priority: 'medium',
      type: 'in_app',
      recipients: [{ userId: user._id, status: 'pending' }],
      channels: ['in_app'],
      expiresAt: new Date(Date.now() + 60000) // 1 minute
    });

    console.log(`✅ Test alert created: ${alert._id}`);
    console.log(`⏰ Expires at: ${alert.expiresAt}`);

    // Check if alert is valid (not expired)
    const isActive = alert.expiresAt > new Date();
    console.log(`🟢 Alert active: ${isActive}`);

    // Wait 70 seconds
    console.log('⏳ Waiting 70 seconds for expiry...');
    await new Promise(resolve => setTimeout(resolve, 70000));

    // Check again
    const expiredAlert = await Alert.findById(alert._id);
    const isExpired = expiredAlert.expiresAt < new Date();
    console.log(`🔴 Alert expired: ${isExpired}`);

    // Verify it's not returned in queries
    const activeAlerts = await Alert.find({
      'recipients.userId': user._id,
      isDeleted: false,
      expiresAt: { $gt: new Date() }
    });

    console.log(`Active alerts for user: ${activeAlerts.length}`);
    const hasExpiredAlert = activeAlerts.some(a => a._id.toString() === alert._id.toString());
    console.log(`Expired alert in active results: ${hasExpiredAlert}`);

    await mongoose.connection.close();
    console.log('Test complete');
  } catch (error) {
    console.error('Test error:', error);
  }
}

testAlertExpiry();