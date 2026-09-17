const logger = require('../utils/logger');
const { verifyToken } = require('../utils/generateToken');
const User = require('../models/User');

const setupSocketIO = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId);
      
      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.userId = user._id;
      socket.userRole = user.role;
      socket.user = user;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.userId})`);

    // Join user room
    socket.join(`user_${socket.userId}`);
    
    // Join role-based room for broadcasts
    socket.join(`role_${socket.userRole}`);

    // Join admin room if admin
    if (socket.userRole === 'admin') {
      socket.join('admin_room');
    }

    // Handle subscribing to specific incident
    socket.on('subscribe_incident', (incidentId) => {
      socket.join(`incident_${incidentId}`);
      logger.info(`Socket ${socket.id} subscribed to incident ${incidentId}`);
    });

    // Handle unsubscribing from specific incident
    socket.on('unsubscribe_incident', (incidentId) => {
      socket.leave(`incident_${incidentId}`);
      logger.info(`Socket ${socket.id} unsubscribed from incident ${incidentId}`);
    });

    // Handle getting unread alerts count
    socket.on('get_unread_count', async () => {
      try {
        const Alert = require('../models/Alert');
        const count = await Alert.countDocuments({
          'recipients.userId': socket.userId,
          'recipients.status': { $ne: 'read' },
          isDeleted: false,
          expiresAt: { $gt: new Date() }
        });
        socket.emit('unread_count', { count });
      } catch (error) {
        logger.error('Get unread count error:', error);
        socket.emit('error', { message: 'Failed to get unread count' });
      }
    });

    // Handle acknowledgment
    socket.on('acknowledge_alert', async (alertId) => {
      try {
        const Alert = require('../models/Alert');
        const alert = await Alert.findById(alertId);
        if (alert) {
          await alert.acknowledge(socket.userId);
          io.emit('alert_acknowledged', {
            alertId,
            userId: socket.userId,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        logger.error('Socket acknowledge error:', error);
        socket.emit('error', { message: 'Failed to acknowledge alert' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  // Global broadcast functions
  const broadcastAlert = (alert, incident = null) => {
    const alertData = {
      alert: alert.toObject ? alert.toObject() : alert,
      incident: incident?.toObject ? incident.toObject() : incident,
      timestamp: new Date().toISOString()
    };

    // Send to all connected users
    io.emit('new_alert', alertData);

    // Send to specific incident room if incident exists
    if (incident) {
      io.to(`incident_${incident._id}`).emit('incident_alert', alertData);
    }
  };

  const broadcastIncidentUpdate = (incident) => {
    io.emit('incident_updated', {
      incident: incident.toObject ? incident.toObject() : incident,
      timestamp: new Date().toISOString()
    });
  };

  const broadcastIncidentCreated = (incident) => {
    io.emit('incident_created', {
      incident: incident.toObject ? incident.toObject() : incident,
      timestamp: new Date().toISOString()
    });
  };

  const sendToUser = (userId, event, data) => {
    io.to(`user_${userId}`).emit(event, data);
  };

  const sendToRole = (role, event, data) => {
    io.to(`role_${role}`).emit(event, data);
  };

  // Attach broadcast functions to io instance
  io.broadcastAlert = broadcastAlert;
  io.broadcastIncidentUpdate = broadcastIncidentUpdate;
  io.broadcastIncidentCreated = broadcastIncidentCreated;
  io.sendToUser = sendToUser;
  io.sendToRole = sendToRole;

  logger.info('Socket.IO setup complete');
  return io;
};

module.exports = setupSocketIO;