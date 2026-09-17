const express = require('express');
const router = express.Router();

const cameraController = require('../controllers/camera.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { USER_ROLES } = require('../config/constants');
const {
  validateCreateCamera,
  validateUpdateCamera,
  validateCameraId,
  validateUpdateZones,
  validateQueryParams,
  validate,
} = require('../validators/camera.validator');

// All routes require authentication
router.use(protect);

// Statistics (any authenticated user)
router.get('/statistics', cameraController.getCameraStatistics);

// List cameras
router.get('/', validateQueryParams, validate, cameraController.getAllCameras);

// Get single camera
router.get('/:id', validateCameraId, validate, cameraController.getCameraById);

// Create camera (Admin only)
router.post(
  '/',
  restrictTo(USER_ROLES.ADMIN),
  validateCreateCamera,
  validate,
  cameraController.createCamera
);

// Update camera (Admin only)
router.put(
  '/:id',
  restrictTo(USER_ROLES.ADMIN),
  validateUpdateCamera,
  validate,
  cameraController.updateCamera
);

// Delete camera (Admin only)
router.delete(
  '/:id',
  restrictTo(USER_ROLES.ADMIN),
  validateCameraId,
  validate,
  cameraController.deleteCamera
);

// Start stream
router.post(
  '/:id/stream',
  restrictTo(USER_ROLES.ADMIN, USER_ROLES.OPERATOR),
  validateCameraId,
  validate,
  cameraController.startStream
);

// Stop stream
router.post(
  '/:id/stop',
  restrictTo(USER_ROLES.ADMIN, USER_ROLES.OPERATOR),
  validateCameraId,
  validate,
  cameraController.stopStream
);

// Test connection
router.post(
  '/:id/test',
  restrictTo(USER_ROLES.ADMIN, USER_ROLES.OPERATOR),
  validateCameraId,
  validate,
  cameraController.testConnection
);

// Update detection zones
router.put(
  '/:id/zones',
  restrictTo(USER_ROLES.ADMIN, USER_ROLES.OPERATOR),
  validateUpdateZones,
  validate,
  cameraController.updateDetectionZones
);

module.exports = router;