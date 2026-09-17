const mongoose = require('mongoose');
const Alert = require('../src/models/Alert');
const User = require('../src/models/User');
const config = require('../src/config/env');

async function testUnreadCount() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'admin@example.com' });
    if (!user) {
      console.log('Test user not found');
      return;
    }

    // Clear existing alerts for this user
    await Alert.deleteMany({ 'recipients.userId': user._id });
    console.log('Cleared existing alerts');

    // Create 5 unread alerts
    for (let i = 0; i < 5; i++) {
      await Alert.create({
        title: `Test Alert ${i + 1}`,
        message: `This is test alert number ${i + 1}`,
        priority: ['low', 'medium', 'high'][i % 3],
        type: 'in_app',
        recipients: [{ userId: user._id, status: 'pending' }],
        channels: ['in_app']
      });
    }
    console.log('Created 5 unread alerts');

    // Create 3 read alerts
    for (let i = 0; i < 3; i++) {
      await Alert.create({
        title: `Read Alert ${i + 1}`,
        message: `This is read alert number ${i + 1}`,
        priority: 'low',
        type: 'in_app',
        recipients: [{ 
          userId: user._id, 
          status: 'read',
          readAt: new Date() 
        }],
        channels: ['in_app']
      });
    }
    console.log('Created 3 read alerts');

    // Count unread
    const unreadCount = await Alert.countDocuments({
      'recipients.userId': user._id,
      'recipients.status': { $ne: 'read' },
      isDeleted: false,
      expiresAt: { $gt: new Date() }
    });

    console.log(`Unread alerts count: ${unreadCount}`);
    console.log(`Expected: 5, Got: ${unreadCount}`);

    // Test mark all as read
    await Alert.updateMany(
      {
        'recipients.userId': user._id,
        'recipients.status': { $ne: 'read' },
        isDeleted: false
      },
      {
        $set: {
          'recipients.$.status': 'read',
          'recipients.$.readAt': new Date()
        }
      }
    );

    const newUnreadCount = await Alert.countDocuments({
      'recipients.userId': user._id,
      'recipients.status': { $ne: 'read' },
      isDeleted: false,
      expiresAt: { $gt: new Date() }
    });

    console.log(`After marking all as read: ${newUnreadCount}`);
    console.log(`Expected: 0, Got: ${newUnreadCount}`);

    await mongoose.connection.close();
    console.log('Test complete');
  } catch (error) {
    console.error('Test error:', error);
  }
}

testUnreadCount();