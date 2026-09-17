const mongoose = require('mongoose');
const { CAMERA_STATUS } = require('../config/constants');

const cameraSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Camera name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },
    ipAddress: {
      type: String,
      required: [true, 'IP address is required'],
      trim: true,
      match: [
        /^(\d{1,3}\.){3}\d{1,3}$/,
        'Please provide a valid IPv4 address',
      ],
    },
    rtspUrl: {
      type: String,
      required: [true, 'RTSP URL is required'],
      trim: true,
      validate: {
        validator: function (v) {
          return v && v.startsWith('rtsp://');
        },
        message: 'RTSP URL must start with rtsp://',
      },
    },
    status: {
      type: String,
      enum: Object.values(CAMERA_STATUS),
      default: CAMERA_STATUS.OFFLINE,
    },
    resolution: {
      type: String,
      default: '1920x1080',
    },
    frameRate: {
      type: Number,
      default: 30,
      min: [1, 'Frame rate must be at least 1'],
      max: [120, 'Frame rate cannot exceed 120'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    detectionZones: [
      {
        name: { type: String, trim: true },
        polygon: [[Number]], // array of [x, y] points
        level: {
          type: String,
          enum: ['low', 'medium', 'high', 'critical'],
          default: 'medium',
        },
        isActive: { type: Boolean, default: true },
      },
    ],
    lastPingAt: {
      type: Date,
      default: null,
    },
    lastStreamStartedAt: {
      type: Date,
      default: null,
    },
    metadata: {
      manufacturer: String,
      model: String,
      firmware: String,
      notes: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
cameraSchema.index({ name: 'text', location: 'text', ipAddress: 'text' });
cameraSchema.index({ status: 1 });
cameraSchema.index({ isActive: 1 });
cameraSchema.index({ assignedTo: 1 });
cameraSchema.index({ isDeleted: 1 });
cameraSchema.index({ createdAt: -1 });

// Virtual: isOnline
cameraSchema.virtual('isOnline').get(function () {
  return (
    this.status === CAMERA_STATUS.ONLINE ||
    this.status === CAMERA_STATUS.RECORDING
  );
});

// Pre-find: exclude soft-deleted records by default
cameraSchema.pre(/^find/, function () {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
});

// Static: get statistics
cameraSchema.statics.getStatistics = async function () {
  const [stats] = await this.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        online: {
          $sum: { $cond: [{ $eq: ['$status', 'online'] }, 1, 0] },
        },
        offline: {
          $sum: { $cond: [{ $eq: ['$status', 'offline'] }, 1, 0] },
        },
        recording: {
          $sum: { $cond: [{ $eq: ['$status', 'recording'] }, 1, 0] },
        },
        error: {
          $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] },
        },
        active: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
        },
        inactive: {
          $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        _id: 0,
        total: 1,
        online: 1,
        offline: 1,
        recording: 1,
        error: 1,
        active: 1,
        inactive: 1,
      },
    },
  ]);

  return (
    stats || {
      total: 0,
      online: 0,
      offline: 0,
      recording: 0,
      error: 0,
      active: 0,
      inactive: 0,
    }
  );
};

// Instance: mark online
cameraSchema.methods.markOnline = async function () {
  this.status = CAMERA_STATUS.ONLINE;
  this.lastPingAt = new Date();
  return this.save();
};

// Instance: mark offline
cameraSchema.methods.markOffline = async function () {
  this.status = CAMERA_STATUS.OFFLINE;
  this.lastPingAt = new Date();
  return this.save();
};

// Instance: start recording
cameraSchema.methods.startRecording = async function () {
  this.status = CAMERA_STATUS.RECORDING;
  this.lastStreamStartedAt = new Date();
  return this.save();
};

// Instance: stop recording
cameraSchema.methods.stopRecording = async function () {
  this.status = CAMERA_STATUS.ONLINE;
  return this.save();
};

const Camera = mongoose.model('Camera', cameraSchema);

module.exports = Camera;