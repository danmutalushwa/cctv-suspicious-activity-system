const Camera = require('../models/Camera');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');
const { CAMERA_STATUS } = require('../config/constants');

/**
 * Create camera
 */
const createCamera = async (req, res) => {
  try {
    const data = { ...req.body };

    // Verify assignedTo user exists if provided
    if (data.assignedTo) {
      const user = await User.findById(data.assignedTo);
      if (!user) return ApiResponse.badRequest(res, 'Assigned user not found');
    }

    const camera = await Camera.create(data);

    await ActivityLog.create({
      user: req.userId,
      action: 'CREATE_CAMERA',
      resource: 'Camera',
      resourceId: camera._id,
      details: { name: camera.name },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    logger.info(`Camera created: ${camera.name} by ${req.user.email}`);

    // Broadcast to socket
    const io = req.app.get('io');
    if (io) {
      io.emit('camera_created', {
        camera: camera.toObject(),
        timestamp: new Date().toISOString(),
      });
    }

    ApiResponse.created(res, { camera }, 'Camera created successfully');
  } catch (error) {
    logger.error('Create camera error:', error);
    ApiResponse.error(res, error, 'Failed to create camera');
  }
};

/**
 * Get all cameras
 */
const getAllCameras = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      isActive,
      assignedTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (isActive !== undefined) filter.isActive = isActive === 'true' || isActive === true;
    if (assignedTo) filter.assignedTo = assignedTo;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [cameras, total] = await Promise.all([
      Camera.find(filter)
        .populate('assignedTo', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Camera.countDocuments(filter),
    ]);

    ApiResponse.success(
      res,
      {
        cameras,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
      'Cameras retrieved successfully'
    );
  } catch (error) {
    logger.error('Get cameras error:', error);
    ApiResponse.error(res, error, 'Failed to retrieve cameras');
  }
};

/**
 * Get camera by ID
 */
const getCameraById = async (req, res) => {
  try {
    const camera = await Camera.findById(req.params.id).populate(
      'assignedTo',
      'name email'
    );

    if (!camera) {
      return ApiResponse.notFound(res, 'Camera not found');
    }

    ApiResponse.success(res, { camera }, 'Camera retrieved successfully');
  } catch (error) {
    logger.error('Get camera error:', error);
    ApiResponse.error(res, error, 'Failed to retrieve camera');
  }
};

/**
 * Update camera
 */
const updateCamera = async (req, res) => {
  try {
    const camera = await Camera.findById(req.params.id);
    if (!camera) return ApiResponse.notFound(res, 'Camera not found');

    const updates = { ...req.body };

    if (updates.assignedTo) {
      const user = await User.findById(updates.assignedTo);
      if (!user) return ApiResponse.badRequest(res, 'Assigned user not found');
    }

    // Prevent tampering with system fields
    delete updates._id;
    delete updates.createdAt;
    delete updates.isDeleted;

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) camera[key] = updates[key];
    });

    await camera.save();

    await ActivityLog.create({
      user: req.userId,
      action: 'UPDATE_CAMERA',
      resource: 'Camera',
      resourceId: camera._id,
      details: { updates },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    logger.info(`Camera updated: ${camera.name} by ${req.user.email}`);

    const io = req.app.get('io');
    if (io) {
      io.emit('camera_updated', {
        camera: camera.toObject(),
        timestamp: new Date().toISOString(),
      });
    }

    ApiResponse.success(res, { camera }, 'Camera updated successfully');
  } catch (error) {
    logger.error('Update camera error:', error);
    ApiResponse.error(res, error, 'Failed to update camera');
  }
};

/**
 * Delete camera (soft delete)
 */
const deleteCamera = async (req, res) => {
  try {
    const camera = await Camera.findById(req.params.id);
    if (!camera) return ApiResponse.notFound(res, 'Camera not found');

    camera.isDeleted = true;
    camera.isActive = false;
    camera.status = CAMERA_STATUS.OFFLINE;
    await camera.save();

    await ActivityLog.create({
      user: req.userId,
      action: 'DELETE_CAMERA',
      resource: 'Camera',
      resourceId: camera._id,
      details: { name: camera.name },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    logger.info(`Camera deleted: ${camera.name} by ${req.user.email}`);

    const io = req.app.get('io');
    if (io) {
      io.emit('camera_deleted', {
        cameraId: camera._id,
        timestamp: new Date().toISOString(),
      });
    }

    ApiResponse.success(res, null, 'Camera deleted successfully');
  } catch (error) {
    logger.error('Delete camera error:', error);
    ApiResponse.error(res, error, 'Failed to delete camera');
  }
};

/**
 * Start stream
 */
const startStream = async (req, res) => {
  try {
    const camera = await Camera.findById(req.params.id);
    if (!camera) return ApiResponse.notFound(res, 'Camera not found');

    if (!camera.isActive) {
      return ApiResponse.badRequest(res, 'Camera is disabled');
    }

    await camera.startRecording();

    await ActivityLog.create({
      user: req.userId,
      action: 'START_STREAM',
      resource: 'Camera',
      resourceId: camera._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    logger.info(`Stream started for camera: ${camera.name}`);

    const io = req.app.get('io');
    if (io) {
      io.emit('camera_stream_started', {
        cameraId: camera._id,
        cameraName: camera.name,
        timestamp: new Date().toISOString(),
      });
    }

    ApiResponse.success(res, { camera }, 'Stream started successfully');
  } catch (error) {
    logger.error('Start stream error:', error);
    ApiResponse.error(res, error, 'Failed to start stream');
  }
};

/**
 * Stop stream
 */
const stopStream = async (req, res) => {
  try {
    const camera = await Camera.findById(req.params.id);
    if (!camera) return ApiResponse.notFound(res, 'Camera not found');

    await camera.stopRecording();

    await ActivityLog.create({
      user: req.userId,
      action: 'STOP_STREAM',
      resource: 'Camera',
      resourceId: camera._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    logger.info(`Stream stopped for camera: ${camera.name}`);

    const io = req.app.get('io');
    if (io) {
      io.emit('camera_stream_stopped', {
        cameraId: camera._id,
        cameraName: camera.name,
        timestamp: new Date().toISOString(),
      });
    }

    ApiResponse.success(res, { camera }, 'Stream stopped successfully');
  } catch (error) {
    logger.error('Stop stream error:', error);
    ApiResponse.error(res, error, 'Failed to stop stream');
  }
};

/**
 * Test camera connection
 * (Simulated: real test would ping the RTSP URL)
 */
const testConnection = async (req, res) => {
  try {
    const camera = await Camera.findById(req.params.id);
    if (!camera) return ApiResponse.notFound(res, 'Camera not found');

    // TODO: Implement real RTSP/network ping
    // For now, simulate based on isActive
    const connected = camera.isActive;

    if (connected) {
      camera.status = CAMERA_STATUS.ONLINE;
      camera.lastPingAt = new Date();
    } else {
      camera.status = CAMERA_STATUS.OFFLINE;
    }
    await camera.save();

    ApiResponse.success(
      res,
      {
        connected,
        camera: {
          id: camera._id,
          name: camera.name,
          status: camera.status,
          lastPingAt: camera.lastPingAt,
        },
      },
      connected ? 'Camera is reachable' : 'Camera is not responding'
    );
  } catch (error) {
    logger.error('Test connection error:', error);
    ApiResponse.error(res, error, 'Failed to test connection');
  }
};

/**
 * Update detection zones
 */
const updateDetectionZones = async (req, res) => {
  try {
    const camera = await Camera.findById(req.params.id);
    if (!camera) return ApiResponse.notFound(res, 'Camera not found');

    camera.detectionZones = req.body.zones || [];
    await camera.save();

    logger.info(`Detection zones updated for camera: ${camera.name}`);

    ApiResponse.success(res, { camera }, 'Detection zones updated successfully');
  } catch (error) {
    logger.error('Update detection zones error:', error);
    ApiResponse.error(res, error, 'Failed to update detection zones');
  }
};

/**
 * Get camera statistics
 */
const getCameraStatistics = async (req, res) => {
  try {
    const stats = await Camera.getStatistics();
    ApiResponse.success(res, stats, 'Camera statistics retrieved successfully');
  } catch (error) {
    logger.error('Get camera statistics error:', error);
    ApiResponse.error(res, error, 'Failed to retrieve statistics');
  }
};

module.exports = {
  createCamera,
  getAllCameras,
  getCameraById,
  updateCamera,
  deleteCamera,
  startStream,
  stopStream,
  testConnection,
  updateDetectionZones,
  getCameraStatistics,
};