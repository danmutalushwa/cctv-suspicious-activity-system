const Incident = require('../models/Incident');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');
const { INCIDENT_STATUS, HTTP_STATUS } = require('../config/constants');

/**
 * Create a new incident
 */
const createIncident = async (req, res) => {
  try {
    const incidentData = {
      ...req.body,
      reportedBy: req.userId
    };

    // If no coordinates but camera ID is provided, get camera location
    // This will be implemented when we add Camera model

    const incident = await Incident.create(incidentData);

    // Log activity
    await ActivityLog.create({
      user: req.userId,
      action: 'CREATE_INCIDENT',
      resource: 'Incident',
      resourceId: incident._id,
      details: { incidentNumber: incident.incidentNumber },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    logger.info(`Incident created: ${incident.incidentNumber} by ${req.user.email}`);

    // Emit socket event for real-time alerts
    const io = req.app.get('io');
    if (io) {
      io.emit('new_incident', {
        incident: {
          id: incident._id,
          incidentNumber: incident.incidentNumber,
          title: incident.title,
          type: incident.type,
          severity: incident.severity,
          location: incident.location
        },
        timestamp: new Date().toISOString()
      });
    }

    ApiResponse.created(res, {
      incident
    }, 'Incident created successfully');
  } catch (error) {
    logger.error('Create incident error:', error);
    ApiResponse.error(res, error, 'Failed to create incident');
  }
};

/**
 * Get all incidents with pagination and filters
 */
const getAllIncidents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      severity,
      startDate,
      endDate,
      search,
      assignedTo
    } = req.query;

    // Build filter
    const filter = { isDeleted: false };

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (severity) filter.severity = severity;
    if (assignedTo) filter.assignedTo = assignedTo;

    // Date range filter
    if (startDate || endDate) {
      filter.detectedAt = {};
      if (startDate) filter.detectedAt.$gte = new Date(startDate);
      if (endDate) filter.detectedAt.$lte = new Date(endDate);
    }

    // Search in title and description
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { incidentNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get incidents
    const [incidents, total] = await Promise.all([
      Incident.find(filter)
        .populate('reportedBy', 'name email')
        .populate('assignedTo', 'name email')
        .populate('reviewedBy', 'name email')
        .sort({ detectedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Incident.countDocuments(filter)
    ]);

    ApiResponse.success(res, {
      incidents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Incidents retrieved successfully');
  } catch (error) {
    logger.error('Get incidents error:', error);
    ApiResponse.error(res, error, 'Failed to retrieve incidents');
  }
};

/**
 * Get incident by ID
 */
const getIncidentById = async (req, res) => {
  try {
    const { id } = req.params;

    const incident = await Incident.findById(id)
      .populate('reportedBy', 'name email phoneNumber')
      .populate('assignedTo', 'name email phoneNumber')
      .populate('reviewedBy', 'name email')
      .populate('notes.createdBy', 'name email')
      .populate('evidence.uploadedBy', 'name email');

    if (!incident || incident.isDeleted) {
      return ApiResponse.notFound(res, 'Incident not found');
    }

    // Log view activity
    await ActivityLog.create({
      user: req.userId,
      action: 'VIEW_INCIDENT',
      resource: 'Incident',
      resourceId: incident._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    ApiResponse.success(res, {
      incident
    }, 'Incident retrieved successfully');
  } catch (error) {
    logger.error('Get incident error:', error);
    ApiResponse.error(res, error, 'Failed to retrieve incident');
  }
};

/**
 * Update incident
 */
const updateIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const incident = await Incident.findById(id);
    if (!incident || incident.isDeleted) {
      return ApiResponse.notFound(res, 'Incident not found');
    }

    // Prevent changing certain fields
    delete updates.incidentNumber;
    delete updates.reportedBy;
    delete updates.createdAt;

    // Update fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        incident[key] = updates[key];
      }
    });

    await incident.save();

    // Log activity
    await ActivityLog.create({
      user: req.userId,
      action: 'UPDATE_INCIDENT',
      resource: 'Incident',
      resourceId: incident._id,
      details: { updates },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    logger.info(`Incident updated: ${incident.incidentNumber} by ${req.user.email}`);

    ApiResponse.success(res, {
      incident
    }, 'Incident updated successfully');
  } catch (error) {
    logger.error('Update incident error:', error);
    ApiResponse.error(res, error, 'Failed to update incident');
  }
};

/**
 * Delete incident (soft delete)
 */
const deleteIncident = async (req, res) => {
  try {
    const { id } = req.params;

    const incident = await Incident.findById(id);
    if (!incident || incident.isDeleted) {
      return ApiResponse.notFound(res, 'Incident not found');
    }

    incident.isDeleted = true;
    await incident.save();

    // Log activity
    await ActivityLog.create({
      user: req.userId,
      action: 'DELETE_INCIDENT',
      resource: 'Incident',
      resourceId: incident._id,
      details: { incidentNumber: incident.incidentNumber },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    logger.info(`Incident deleted: ${incident.incidentNumber} by ${req.user.email}`);

    ApiResponse.success(res, null, 'Incident deleted successfully');
  } catch (error) {
    logger.error('Delete incident error:', error);
    ApiResponse.error(res, error, 'Failed to delete incident');
  }
};

/**
 * Assign incident to user
 */
const assignIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    // Check if user exists
    const user = await User.findById(assignedTo);
    if (!user) {
      return ApiResponse.notFound(res, 'User not found');
    }

    const incident = await Incident.findById(id);
    if (!incident || incident.isDeleted) {
      return ApiResponse.notFound(res, 'Incident not found');
    }

    incident.assignedTo = assignedTo;
    incident.status = INCIDENT_STATUS.UNDER_REVIEW;
    await incident.save();

    // Log activity
    await ActivityLog.create({
      user: req.userId,
      action: 'ASSIGN_INCIDENT',
      resource: 'Incident',
      resourceId: incident._id,
      details: { 
        assignedTo: user.email,
        incidentNumber: incident.incidentNumber 
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    logger.info(`Incident ${incident.incidentNumber} assigned to ${user.email}`);

    ApiResponse.success(res, {
      incident
    }, 'Incident assigned successfully');
  } catch (error) {
    logger.error('Assign incident error:', error);
    ApiResponse.error(res, error, 'Failed to assign incident');
  }
};

/**
 * Resolve incident
 */
const resolveIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionNotes, actionTaken } = req.body;

    const incident = await Incident.findById(id);
    if (!incident || incident.isDeleted) {
      return ApiResponse.notFound(res, 'Incident not found');
    }

    incident.status = INCIDENT_STATUS.RESOLVED;
    incident.resolution = {
      status: 'resolved',
      resolvedAt: new Date(),
      resolvedBy: req.userId,
      resolutionNotes,
      actionTaken
    };
    await incident.save();

    // Log activity
    await ActivityLog.create({
      user: req.userId,
      action: 'RESOLVE_INCIDENT',
      resource: 'Incident',
      resourceId: incident._id,
      details: { 
        incidentNumber: incident.incidentNumber,
        resolutionNotes 
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    logger.info(`Incident resolved: ${incident.incidentNumber} by ${req.user.email}`);

    ApiResponse.success(res, {
      incident
    }, 'Incident resolved successfully');
  } catch (error) {
    logger.error('Resolve incident error:', error);
    ApiResponse.error(res, error, 'Failed to resolve incident');
  }
};

/**
 * Add note to incident
 */
const addNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, isInternal = false } = req.body;

    const incident = await Incident.findById(id);
    if (!incident || incident.isDeleted) {
      return ApiResponse.notFound(res, 'Incident not found');
    }

    await incident.addNote(text, req.userId, isInternal);

    // Log activity
    await ActivityLog.create({
      user: req.userId,
      action: 'ADD_NOTE',
      resource: 'Incident',
      resourceId: incident._id,
      details: { 
        incidentNumber: incident.incidentNumber,
        note: text.substring(0, 50) + '...' 
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    ApiResponse.success(res, {
      incident
    }, 'Note added successfully');
  } catch (error) {
    logger.error('Add note error:', error);
    ApiResponse.error(res, error, 'Failed to add note');
  }
};

/**
 * Upload evidence for incident
 */
const uploadEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    if (!req.files || req.files.length === 0) {
      return ApiResponse.badRequest(res, 'No files uploaded');
    }

    const incident = await Incident.findById(id);
    if (!incident || incident.isDeleted) {
      return ApiResponse.notFound(res, 'Incident not found');
    }

    const evidenceUploads = req.files.map(file => {
        let folder;

        if (file.mimetype.startsWith('image/')) {
            folder = 'images';
        } else if (file.mimetype.startsWith('video/')) {
            folder = 'videos';
        } else if (file.mimetype.startsWith('audio/')) {
            folder = 'audio';
        } else {
            folder = 'documents';
        }

        return {
            type: type || (
            file.mimetype.startsWith('image/') ? 'image' :
            file.mimetype.startsWith('video/') ? 'video' :
            file.mimetype.startsWith('audio/') ? 'audio' :
            'document'
            ),
            url: `/uploads/evidence/${folder}/${file.filename}`,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            uploadedBy: req.userId
        };
    });

    await incident.addEvidence(evidenceUploads, req.userId);

    // Log activity
    await ActivityLog.create({
      user: req.userId,
      action: 'UPLOAD_EVIDENCE',
      resource: 'Incident',
      resourceId: incident._id,
      details: { 
        incidentNumber: incident.incidentNumber,
        files: evidenceUploads.map(e => e.fileName)
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    ApiResponse.success(res, {
      incident
    }, 'Evidence uploaded successfully');
  } catch (error) {
    logger.error('Upload evidence error:', error);
    ApiResponse.error(res, error, 'Failed to upload evidence');
  }
};

/**
 * Get incident statistics
 */
const getIncidentStatistics = async (req, res) => {
  try {
    const stats = await Incident.aggregate([
      { $match: { isDeleted: false } },
      {
        $facet: {
          statusCounts: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          typeCounts: [
            { $group: { _id: '$type', count: { $sum: 1 } } }
          ],
          severityCounts: [
            { $group: { _id: '$severity', count: { $sum: 1 } } }
          ],
          total: [
            { $count: 'total' }
          ],
          recent: [
            { $sort: { detectedAt: -1 } },
            { $limit: 5 }
          ]
        }
      }
    ]);

    const statistics = {
      total: stats[0].total[0]?.total || 0,
      byStatus: stats[0].statusCounts,
      byType: stats[0].typeCounts,
      bySeverity: stats[0].severityCounts,
      recentIncidents: stats[0].recent
    };

    ApiResponse.success(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Get statistics error:', error);
    ApiResponse.error(res, error, 'Failed to retrieve statistics');
  }
};

module.exports = {
  createIncident,
  getAllIncidents,
  getIncidentById,
  updateIncident,
  deleteIncident,
  assignIncident,
  resolveIncident,
  addNote,
  uploadEvidence,
  getIncidentStatistics
};