const mongoose = require('mongoose');
const { 
  INCIDENT_STATUS, 
  INCIDENT_TYPES, 
  SEVERITY 
} = require('../config/constants');

const incidentSchema = new mongoose.Schema({
  incidentNumber: {
    type: String,
    unique: true,
    
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  type: {
    type: String,
    enum: Object.values(INCIDENT_TYPES),
    required: [true, 'Incident type is required']
  },
  status: {
    type: String,
    enum: Object.values(INCIDENT_STATUS),
    default: INCIDENT_STATUS.PENDING
  },
  severity: {
    type: String,
    enum: Object.values(SEVERITY),
    required: [true, 'Severity is required']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    },
    address: {
      type: String,
      trim: true
    },
    cameraId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Camera'
    }
  },
  detectedAt: {
    type: Date,
    default: Date.now
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  boundingBox: {
    x: { type: Number },
    y: { type: Number },
    width: { type: Number },
    height: { type: Number }
  },
  evidence: [{
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'document'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    fileName: String,
    fileSize: Number,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  notes: [{
    text: {
      type: String,
      required: true,
      maxlength: 1000
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isInternal: {
      type: Boolean,
      default: false
    }
  }],
  resolution: {
    status: {
      type: String,
      enum: ['resolved', 'unresolved', 'pending'],
      default: 'pending'
    },
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolutionNotes: String,
    actionTaken: String
  },
  aiAnalysis: {
    predictedType: String,
    confidence: Number,
    features: mongoose.Schema.Types.Mixed,
    modelVersion: String,
    processedAt: Date
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceInfo: String
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

// Pre-save middleware to generate incident number
incidentSchema.pre('save', async function() {
  if (this.isNew) {
    const count = await mongoose.model('Incident').countDocuments();
    const year = new Date().getFullYear();
    this.incidentNumber = `INC-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  
});

// Virtual for age of incident
incidentSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.detectedAt) / (1000 * 60 * 60));
});

// Indexes for better performance
incidentSchema.index({ status: 1 });
incidentSchema.index({ type: 1 });
incidentSchema.index({ severity: 1 });
incidentSchema.index({ detectedAt: -1 });
incidentSchema.index({ location: '2dsphere' });
incidentSchema.index({ reportedBy: 1 });
incidentSchema.index({ assignedTo: 1 });
incidentSchema.index({ 'isDeleted': 1 });

// Compound indexes for common queries
incidentSchema.index({ status: 1, severity: 1 });
incidentSchema.index({ type: 1, status: 1 });
incidentSchema.index({ detectedAt: -1, status: 1 });

// Static method to find incidents by date range
incidentSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    detectedAt: {
      $gte: startDate,
      $lte: endDate
    },
    isDeleted: false
  });
};

// Static method to get statistics
incidentSchema.statics.getStatistics = async function() {
  return await this.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        incidents: { $push: '$$ROOT' }
      }
    }
  ]);
};

// Method to add note
incidentSchema.methods.addNote = async function(text, userId, isInternal = false) {
  this.notes.push({
    text,
    createdBy: userId,
    isInternal
  });
  return await this.save();
};

// Method to assign incident
incidentSchema.methods.assignTo = async function(userId) {
  this.assignedTo = userId;
  this.status = INCIDENT_STATUS.UNDER_REVIEW;
  return await this.save();
};

// Method to resolve incident
incidentSchema.methods.resolve = async function(userId, resolutionNotes, actionTaken) {
  this.status = INCIDENT_STATUS.RESOLVED;
  this.resolution = {
    status: 'resolved',
    resolvedAt: new Date(),
    resolvedBy: userId,
    resolutionNotes,
    actionTaken
  };
  return await this.save();
};

// Method to add evidence
incidentSchema.methods.addEvidence = async function(evidenceData, userId) {
    if (Array.isArray(evidenceData)) {
        evidenceData.forEach(evidence => {
            this.evidence.push({
                ...evidence,
                uploadedBy: userId
            });
        });
    }else {
  this.evidence.push({
    ...evidenceData,
    uploadedBy: userId
  });
}
  return await this.save();
};

const Incident = mongoose.model('Incident', incidentSchema);

module.exports = Incident;