const mongoose = require('mongoose');
const { ALERT_TYPES, ALERT_PRIORITY } = require('../config/constants');

const alertSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Alert title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Alert message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: Object.values(ALERT_TYPES),
    default: ALERT_TYPES.IN_APP
  },
  priority: {
    type: String,
    enum: Object.values(ALERT_PRIORITY),
    default: ALERT_PRIORITY.MEDIUM
  },
  incidentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident'
  },
  cameraId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Camera'
  },
  recipients: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
      default: 'pending'
    },
    sentAt: Date,
    readAt: Date,
    deliveredAt: Date,
    error: String
  }],
  channels: [{
    type: String,
    enum: ['email', 'sms', 'push', 'in_app', 'socket']
  }],
  metadata: {
    location: String,
    severity: String,
    cameraName: String,
    timestamp: Date
  },
  isAcknowledged: {
    type: Boolean,
    default: false
  },
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedAt: Date,
  expiresAt: {
    type: Date,
    default: function() {
      // Default expiry: 24 hours from creation
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
alertSchema.index({ incidentId: 1 });
alertSchema.index({ 'recipients.userId': 1 });
alertSchema.index({ 'recipients.status': 1 });
alertSchema.index({ priority: 1 });
alertSchema.index({ createdAt: -1 });
alertSchema.index({ expiresAt: 1 });
alertSchema.index({ isDeleted: 1 });

// Compound indexes
alertSchema.index({ priority: 1, 'recipients.userId': 1 });
alertSchema.index({ createdAt: -1, 'recipients.userId': 1 });

// Static method to get unread alerts for user
alertSchema.statics.getUnreadForUser = async function(userId) {
  return await this.find({
    'recipients.userId': userId,
    'recipients.status': { $ne: 'read' },
    isDeleted: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

// Static method to mark alerts as read
alertSchema.statics.markAsRead = async function(alertId, userId) {
  return await this.findOneAndUpdate(
    {
      _id: alertId,
      'recipients.userId': userId
    },
    {
      $set: {
        'recipients.$.status': 'read',
        'recipients.$.readAt': new Date()
      }
    },
    { new: true }
  );
};

// Method to mark alert as acknowledged
alertSchema.methods.acknowledge = async function(userId) {
  this.isAcknowledged = true;
  this.acknowledgedBy = userId;
  this.acknowledgedAt = new Date();
  return await this.save();
};

// Method to add recipient
alertSchema.methods.addRecipient = async function(userId) {
  if(!userId) {
    throw new Error('User ID is required to add a recipient');
  }
  const existingRecipient = this.recipients.find(
    r => r.userId && r.userId.toString() === userId.toString()
  );
  
  if (!existingRecipient) {
    this.recipients.push({
      userId,
      status: 'pending'
    });
    await this.save();
  }
  
  return this;
};

// Method to update recipient status
alertSchema.methods.updateRecipientStatus = async function(userId, status) {
    if (!userId) {
        throw new Error('User ID is required to update recipient status');
    }
  const recipient = this.recipients.find(
    r => r.userId && r.userId.toString() === userId.toString()
  );
  
  if (!recipient) {
    return this;
  }
    recipient.status = status;
    if (status === 'sent') {
         recipient.sentAt = new Date();
    }
    if (status === 'delivered') {
         recipient.deliveredAt = new Date();
    }
    if (status === 'read') {
        recipient.readAt = new Date();
    }
    await this.save();
  
  return this;
};

const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert;