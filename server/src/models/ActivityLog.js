const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'LOGOUT',
      'CREATE_INCIDENT',
      'UPDATE_INCIDENT',
      'DELETE_INCIDENT',
      'ASSIGN_INCIDENT',
      'RESOLVE_INCIDENT',
      'ADD_NOTE',
      'UPLOAD_EVIDENCE',
      'VIEW_INCIDENT',
      'EXPORT_REPORT',
      'UPDATE_PROFILE',
      'CHANGE_PASSWORD',
      'CREATE_USER',
      'UPDATE_USER',
      'DELETE_USER',
      'CREATE_CAMERA',
      'UPDATE_CAMERA',
      'DELETE_CAMERA',
      'START_STREAM',
      'STOP_STREAM'
    ]
  },
  resource: {
    type: String,
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Indexes
activityLogSchema.index({ user: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ resource: 1, resourceId: 1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;