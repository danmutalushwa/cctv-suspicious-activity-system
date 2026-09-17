const { body, param, query, validationResult } = require('express-validator');
const { CAMERA_STATUS } = require('../config/constants');

// Create camera
const validateCreateCamera = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),

  body('location')
    .trim()
    .notEmpty().withMessage('Location is required')
    .isLength({ max: 200 }).withMessage('Location cannot exceed 200 characters'),

  body('ipAddress')
    .trim()
    .notEmpty().withMessage('IP address is required')
    .matches(/^(\d{1,3}\.){3}\d{1,3}$/).withMessage('Invalid IPv4 address'),

  body('rtspUrl')
    .trim()
    .notEmpty().withMessage('RTSP URL is required')
    .custom((value) => {
      if (!value.startsWith('rtsp://')) {
        throw new Error('RTSP URL must start with rtsp://');
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(Object.values(CAMERA_STATUS)).withMessage('Invalid camera status'),

  body('resolution')
    .optional()
    .trim()
    .matches(/^\d+x\d+$/).withMessage('Resolution must be in WxH format (e.g., 1920x1080)'),

  body('frameRate')
    .optional()
    .isInt({ min: 1, max: 120 }).withMessage('Frame rate must be 1-120'),

  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be boolean'),

  body('assignedTo')
    .optional({ nullable: true })
    .isMongoId().withMessage('Invalid user ID'),
];

// Update camera
const validateUpdateCamera = [
  param('id').isMongoId().withMessage('Invalid camera ID'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Location cannot exceed 200 characters'),

  body('ipAddress')
    .optional()
    .trim()
    .matches(/^(\d{1,3}\.){3}\d{1,3}$/).withMessage('Invalid IPv4 address'),

  body('rtspUrl')
    .optional()
    .trim()
    .custom((value) => {
      if (value && !value.startsWith('rtsp://')) {
        throw new Error('RTSP URL must start with rtsp://');
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(Object.values(CAMERA_STATUS)).withMessage('Invalid camera status'),

  body('resolution')
    .optional()
    .trim()
    .matches(/^\d+x\d+$/).withMessage('Invalid resolution format'),

  body('frameRate')
    .optional()
    .isInt({ min: 1, max: 120 }).withMessage('Frame rate must be 1-120'),

  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be boolean'),

  body('assignedTo')
    .optional({ nullable: true })
    .isMongoId().withMessage('Invalid user ID'),
];

// Validate camera id in params
const validateCameraId = [
  param('id').isMongoId().withMessage('Invalid camera ID'),
];

// Update detection zones
const validateUpdateZones = [
  param('id').isMongoId().withMessage('Invalid camera ID'),
  body('zones')
    .isArray().withMessage('Zones must be an array'),
  body('zones.*.name')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Zone name cannot exceed 100 characters'),
  body('zones.*.level')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid zone level'),
  body('zones.*.polygon')
    .optional()
    .isArray().withMessage('Polygon must be an array of [x,y] points'),
];

// Query validators
const validateQueryParams = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('status').optional().isIn(Object.values(CAMERA_STATUS)).withMessage('Invalid status'),
  query('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  query('assignedTo').optional().isMongoId().withMessage('Invalid user ID'),
];

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array().map((e) => e.msg),
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

module.exports = {
  validateCreateCamera,
  validateUpdateCamera,
  validateCameraId,
  validateUpdateZones,
  validateQueryParams,
  validate,
};