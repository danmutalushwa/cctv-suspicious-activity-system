const Alert = require('../models/Alert');
const Incident = require('../models/Incident');
const User = require('../models/User');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');
const { sendBulkAlertEmails } = require('../services/email.service');
const { ALERT_TYPES, ALERT_PRIORITY } = require('../config/constants');

/**
 * Create a new alert
 */
const createAlert = async (req, res) => {
  try {
    const alertData = {
      ...req.body,
      recipients: req.body.recipients || [],
      channels: req.body.channels || ['in_app', 'socket']
    };

    // If incidentId is provided, get incident details for metadata
    if (alertData.incidentId) {
      const incident = await Incident.findById(alertData.incidentId);
      if (incident) {
        alertData.metadata = {
          location: incident.location?.address,
          severity: incident.severity,
          cameraName: incident.location?.cameraName,
          timestamp: incident.detectedAt
        };
      }
    }

    // If no recipients specified, send to all admins
    if (!alertData.recipients || alertData.recipients.length === 0) {
      const admins = await User.find({ 
        role: 'admin', 
        isActive: true 
      });
      alertData.recipients = admins.map(a => ({
        userId: a._id,
        status: 'pending'
      }));
    }
    
    const alert = await Alert.create(alertData);

    // Send notifications through different channels
    await sendNotifications(alert);

    // Log activity
    logger.info(`Alert created: ${alert.title} with priority ${alert.priority}`);

    // Emit socket event for real-time notifications
    const io = req.app.get('io');
    if (io) {
      // Get populated alert data
      const populatedAlert = await Alert.findById(alert._id)
        .populate('recipients.userId', 'name email')
        .populate('incidentId', 'incidentNumber title type severity');
      
      // Send to all connected admins
      io.emit('new_alert', {
        alert: populatedAlert,
        timestamp: new Date().toISOString()
      });
    }

    ApiResponse.created(res, {
      alert
    }, 'Alert created successfully');
  } catch (error) {
    logger.error('Create alert error:', error);
    ApiResponse.error(res, error, 'Failed to create alert');
  }
};

/**
 * Get all alerts for current user
 */
const getMyAlerts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      type
    } = req.query;

    const filter = {
      'recipients.userId': req.userId,
      isDeleted: false,
      expiresAt: { $gt: new Date() }
    };

    if (status) {
      filter['recipients.status'] = status;
    }
    if (priority) {
      filter.priority = priority;
    }
    if (type) {
      filter.type = type;
    }

    const skip = (page - 1) * limit;

    const [alerts, total] = await Promise.all([
      Alert.find(filter)
        .populate('incidentId', 'incidentNumber title type severity location')
        .populate('cameraId', 'name location')
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Alert.countDocuments(filter)
    ]);

    // Get unread count
    const unreadCount = await Alert.countDocuments({
      'recipients.userId': req.userId,
      'recipients.status': { $ne: 'read' },
      isDeleted: false,
      expiresAt: { $gt: new Date() }
    });

    ApiResponse.success(res, {
      alerts,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Alerts retrieved successfully');
  } catch (error) {
    logger.error('Get alerts error:', error);
    ApiResponse.error(res, error, 'Failed to retrieve alerts');
  }
};

/**
 * Get alert by ID
 */
const getAlertById = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findById(id)
      .populate('incidentId', 'incidentNumber title type severity location status')
      .populate('cameraId', 'name location status')
      .populate('recipients.userId', 'name email')
      .populate('acknowledgedBy', 'name email');

    if (!alert || alert.isDeleted) {
      return ApiResponse.notFound(res, 'Alert not found');
    }

    // Check if user has access to this alert
    const hasAccess = alert.recipients.some(
      r => r.userId?._id?.toString() === req.userId?.toString() ||
      r.userId?.toString() === req.userId?.toString()
    ) || req.userRole === 'admin';

    if (!hasAccess) {
      return ApiResponse.forbidden(res, 'You do not have access to this alert');
    }

    // Mark as read if viewing
    if (req.query.markAsRead !== 'false') {
      await alert.updateRecipientStatus(req.userId, 'read');
    }

    ApiResponse.success(res, {
      alert
    }, 'Alert retrieved successfully');
  } catch (error) {
    logger.error('Get alert error:', error);
    ApiResponse.error(res, error, 'Failed to retrieve alert');
  }
};

/**
 * Mark alert as read
 */
const markAlertAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findById(id);
    if (!alert || alert.isDeleted) {
      return ApiResponse.notFound(res, 'Alert not found');
    }

    await alert.updateRecipientStatus(req.userId, 'read');

    ApiResponse.success(res, null, 'Alert marked as read');
  } catch (error) {
    logger.error('Mark alert as read error:', error);
    ApiResponse.error(res, error, 'Failed to mark alert as read');
  }
};

/**
 * Mark all alerts as read for current user
 */
const markAllAlertsAsRead = async (req, res) => {
  try {
    await Alert.updateMany(
      {
        'recipients.userId': req.userId,
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

    ApiResponse.success(res, null, 'All alerts marked as read');
  } catch (error) {
    logger.error('Mark all alerts as read error:', error);
    ApiResponse.error(res, error, 'Failed to mark alerts as read');
  }
};

/**
 * Acknowledge alert
 */
const acknowledgeAlert = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findById(id);
    if (!alert || alert.isDeleted) {
      return ApiResponse.notFound(res, 'Alert not found');
    }

    // Check if user has access safely
    const hasAccess = alert.recipients.some(r => {
    if (!r?.userId) return false; // Skip if userId is missing or null
    const recipientId = r.userId._id ? r.userId._id : r.userId;
    return recipientId.toString() === req.userId?.toString();
    }) || req.userRole === 'admin';

    if (!hasAccess) {
      return ApiResponse.forbidden(res, 'You do not have permission to acknowledge this alert');
    }

    await alert.acknowledge(req.userId);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('alert_acknowledged', {
        alertId: alert._id,
        userId: req.userId,
        timestamp: new Date().toISOString()
      });
    }

    ApiResponse.success(res, {
      alert
    }, 'Alert acknowledged successfully');
  } catch (error) {
    logger.error('Acknowledge alert error:', error);
    ApiResponse.error(res, error, 'Failed to acknowledge alert');
  }
};

/**
 * Delete alert (soft delete)
 */
const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findById(id);
    if (!alert || alert.isDeleted) {
      return ApiResponse.notFound(res, 'Alert not found');
    }

    // Only admin or creator can delete
    const isAdmin = req.userRole === 'admin';
    if (!isAdmin) {
      return ApiResponse.forbidden(res, 'You do not have permission to delete this alert');
    }

    alert.isDeleted = true;
    await alert.save();

    logger.info(`Alert deleted: ${alert._id} by ${req.user.email}`);

    ApiResponse.success(res, null, 'Alert deleted successfully');
  } catch (error) {
    logger.error('Delete alert error:', error);
    ApiResponse.error(res, error, 'Failed to delete alert');
  }
};

/**
 * Get alert statistics
 */
const getAlertStatistics = async (req, res) => {
  try {
    const userId = req.userId;

    const stats = await Alert.aggregate([
      { $match: { 
        'recipients.userId': userId,
        isDeleted: false 
      }},
      {
        $facet: {
          unreadCount: [
            { $match: { 'recipients.status': { $ne: 'read' } } },
            { $count: 'count' }
          ],
          byPriority: [
            { $group: { _id: '$priority', count: { $sum: 1 } } }
          ],
          byType: [
            { $group: { _id: '$type', count: { $sum: 1 } } }
          ],
          recent: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 }
          ]
        }
      }
    ]);

    const statistics = {
      unreadCount: stats[0].unreadCount[0]?.count || 0,
      byPriority: stats[0].byPriority,
      byType: stats[0].byType,
      recent: stats[0].recent
    };

    ApiResponse.success(res, statistics, 'Alert statistics retrieved successfully');
  } catch (error) {
    logger.error('Get alert statistics error:', error);
    ApiResponse.error(res, error, 'Failed to retrieve alert statistics');
  }
};

// Helper function to send notifications through different channels
const sendNotifications = async (alert) => {
  try {
    // Get full alert with populated data
    const fullAlert = await Alert.findById(alert._id)
      .populate('recipients.userId', 'name email phoneNumber preferences')
      .populate('incidentId');

    const recipients = fullAlert.recipients;

    // Determine which channels to use
    const channels = alert.channels || ['in_app'];

    // Send email notifications
    if (channels.includes('email')) {
      const emailUsers = recipients
        .filter(r => r.userId && r.userId.preferences?.notifications?.email !== false)
        .map(r => r.userId);

      if (emailUsers.length > 0) {
        await sendBulkAlertEmails(emailUsers, fullAlert, fullAlert.incidentId);
      }
    }

    // Socket notifications are handled separately in the route
    // SMS notifications can be added here if SMS service is available

    logger.info(`Notifications sent for alert ${alert._id}`);
  } catch (error) {
    logger.error('Send notifications error:', error);
  }
};

module.exports = {
  createAlert,
  getMyAlerts,
  getAlertById,
  markAlertAsRead,
  markAllAlertsAsRead,
  acknowledgeAlert,
  deleteAlert,
  getAlertStatistics
};