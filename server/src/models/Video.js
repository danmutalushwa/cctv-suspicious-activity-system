const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Video title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  thumbnailPath: {
    type: String
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  resolution: {
    width: Number,
    height: Number
  },
  framerate: {
    type: Number
  },
  bitrate: {
    type: Number
  },
  codec: {
    type: String
  },
  cameraId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Camera'
  },
  incidentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['uploading', 'processing', 'completed', 'failed'],
    default: 'uploading'
  },
  processingError: {
    type: String
  },
  aiAnalysis: {
    status: {
      type: String,
      enum: ['not_started', 'processing', 'completed', 'failed'],
      default: 'not_started'
    },

    frameCount: {
      type: Number,
      default: 0
    },

    analyzedFrames: {
      type: Number,
      default: 0
    },

    suspiciousFrames: {
      type: Number,
      default: 0
    },

    incidentsCreated: {
      type: Number,
      default: 0
    },

    overallSeverity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    },

    activities: [{
      type: String
    }],

    detections: [{
      frame: String,
      activities: [String],
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      },
      confidence: Number,
      trackId: mongoose.Schema.Types.Mixed,
      bbox: [Number],
      zone: String
    }],

    model: {
      type: String
    },

    processedAt: {
      type: Date
    },

    error: {
      type: String
    }
  },
  metadata: {
    recordedAt: Date,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number]
    },
    tags: [String],
    custom: mongoose.Schema.Types.Mixed
  },
  views: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Default: 30 days from upload
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
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
videoSchema.index({ cameraId: 1 });
videoSchema.index({ incidentId: 1 });
videoSchema.index({ uploadedBy: 1 });
videoSchema.index({ status: 1 });
videoSchema.index({ createdAt: -1 });
videoSchema.index({ isDeleted: 1 });
videoSchema.index({ expiresAt: 1 });
videoSchema.index({ location: '2dsphere' });

// Compound indexes
videoSchema.index({ cameraId: 1, createdAt: -1 });
videoSchema.index({ status: 1, createdAt: -1 });

// Virtual for file size in MB
videoSchema.virtual('fileSizeMB').get(function() {
  return (this.fileSize / (1024 * 1024)).toFixed(2);
});

// Virtual for age in days
videoSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Static method to get video statistics
videoSchema.statics.getStatistics = async function() {
  return await this.aggregate([
    { $match: { isDeleted: false } },
    {
      $facet: {
        total: [{ $count: 'count' }],
        totalSize: [
          { $group: { _id: null, total: { $sum: '$fileSize' } } }
        ],
        byCamera: [
          { $group: { _id: '$cameraId', count: { $sum: 1 } } }
        ],
        byStatus: [
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ],
        recent: [
          { $sort: { createdAt: -1 } },
          { $limit: 10 }
        ]
      }
    }
  ]);
};

// Method to increment view count
videoSchema.methods.incrementViews = async function() {
  this.views += 1;
  return await this.save();
};

// Method to increment download count
videoSchema.methods.incrementDownloads = async function() {
  this.downloads += 1;
  return await this.save();
};

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;