const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Report title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['incident_summary', 'daily_activity', 'weekly_analytics', 'monthly_report', 'custom'],
    required: true
  },
  format: {
    type: String,
    enum: ['pdf', 'excel', 'csv', 'json'],
    default: 'pdf'
  },
  status: {
    type: String,
    enum: ['pending', 'generating', 'completed', 'failed'],
    default: 'pending'
  },
  parameters: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    filters: {
      incidentTypes: [String],
      severity: [String],
      status: [String],
      cameraIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Camera'
      }],
      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    grouping: {
      type: String,
      enum: ['day', 'week', 'month', 'hour'],
      default: 'day'
    },
    includeDetails: {
      type: Boolean,
      default: true
    },
    includeCharts: {
      type: Boolean,
      default: true
    }
  },
  generatedData: {
    summary: mongoose.Schema.Types.Mixed,
    statistics: mongoose.Schema.Types.Mixed,
    charts: mongoose.Schema.Types.Mixed,
    incidents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident'
    }]
  },
  filePath: {
    type: String
  },
  fileSize: {
    type: Number
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generatedAt: {
    type: Date
  },
  schedule: {
    enabled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly']
    },
    time: String, // Format: HH:mm
    dayOfWeek: Number, // 0-6, Sunday = 0
    dayOfMonth: Number, // 1-31
    lastGeneratedAt: Date,
    nextGenerationAt: Date
  },
  delivery: {
    email: {
      enabled: { type: Boolean, default: false },
      recipients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    },
    dashboard: {
      enabled: { type: Boolean, default: true }
    },
    webhook: {
      enabled: { type: Boolean, default: false },
      url: String
    }
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
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
reportSchema.index({ generatedBy: 1 });
reportSchema.index({ type: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ 'parameters.startDate': 1, 'parameters.endDate': 1 });
reportSchema.index({ expiresAt: 1 });
reportSchema.index({ isDeleted: 1 });

// Compound indexes
reportSchema.index({ type: 1, status: 1 });
reportSchema.index({ generatedBy: 1, createdAt: -1 });

// Virtual for age in days
reportSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for file size in MB
reportSchema.virtual('fileSizeMB').get(function() {
  return this.fileSize ? (this.fileSize / (1024 * 1024)).toFixed(2) : 0;
});

// Static method to get report statistics
reportSchema.statics.getStatistics = async function(userId) {
  return await this.aggregate([
    { $match: { 
      generatedBy: userId,
      isDeleted: false 
    }},
    {
      $facet: {
        total: [{ $count: 'count' }],
        byType: [
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ],
        byStatus: [
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ],
        byFormat: [
          { $group: { _id: '$format', count: { $sum: 1 } } }
        ],
        recent: [
          { $sort: { createdAt: -1 } },
          { $limit: 5 }
        ]
      }
    }
  ]);
};

// Method to increment download count
reportSchema.methods.incrementDownloads = async function() {
  this.downloadCount += 1;
  return await this.save();
};

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;