const { body, param, query, validationResult } = require('express-validator');
const { INCIDENT_TYPES, SEVERITY, INCIDENT_STATUS } = require('../config/constants');

// Validation rules for creating incident
const validateCreateIncident = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  
  body('type')
    .notEmpty().withMessage('Incident type is required')
    .isIn(Object.values(INCIDENT_TYPES)).withMessage('Invalid incident type'),
  
  body('severity')
    .notEmpty().withMessage('Severity is required')
    .isIn(Object.values(SEVERITY)).withMessage('Invalid severity level'),
  
  body('location.address')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Address cannot exceed 200 characters'),
  
  body('location.coordinates')
    .optional()
    .isArray().withMessage('Coordinates must be an array')
    .custom((value) => {
      if (value && value.length === 2) {
        const [lng, lat] = value;
        if (lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
          return true;
        }
      }
      throw new Error('Invalid coordinates. Must be [longitude, latitude]');
    }),
  
  body('location.cameraId')
    .optional()
    .isMongoId().withMessage('Invalid camera ID'),
  
  body('confidence')
    .optional()
    .isFloat({ min: 0, max: 1 }).withMessage('Confidence must be between 0 and 1'),
  
  body('boundingBox')
    .optional()
    .isObject().withMessage('Bounding box must be an object')
    .custom((value) => {
      if (value) {
        const { x, y, width, height } = value;
        if (typeof x === 'number' && typeof y === 'number' && 
            typeof width === 'number' && typeof height === 'number') {
          return true;
        }
      }
      throw new Error('Invalid bounding box format');
    })
];

// Validation rules for updating incident
const validateUpdateIncident = [
  param('id')
    .isMongoId().withMessage('Invalid incident ID'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  
  body('type')
    .optional()
    .isIn(Object.values(INCIDENT_TYPES)).withMessage('Invalid incident type'),
  
  body('status')
    .optional()
    .isIn(Object.values(INCIDENT_STATUS)).withMessage('Invalid status'),
  
  body('severity')
    .optional()
    .isIn(Object.values(SEVERITY)).withMessage('Invalid severity level'),
  
  body('assignedTo')
    .optional()
    .isMongoId().withMessage('Invalid user ID')
];

// Validation rules for adding note
const validateAddNote = [
  param('id')
    .isMongoId().withMessage('Invalid incident ID'),
  
  body('text')
    .trim()
    .notEmpty().withMessage('Note text is required')
    .isLength({ max: 1000 }).withMessage('Note cannot exceed 1000 characters'),
  
  body('isInternal')
    .optional()
    .isBoolean().withMessage('isInternal must be boolean')
];

// Validation rules for adding evidence
const validateAddEvidence = [
  param('id')
    .isMongoId().withMessage('Invalid incident ID'),
  
  body('type')
    .notEmpty().withMessage('Evidence type is required')
    .isIn(['image', 'video', 'audio', 'document']).withMessage('Invalid evidence type')
];

// Validation rules for assigning incident
const validateAssignIncident = [
  param('id')
    .isMongoId().withMessage('Invalid incident ID'),
  
  body('assignedTo')
    .notEmpty().withMessage('User ID is required')
    .isMongoId().withMessage('Invalid user ID')
];

// Validation rules for resolving incident
const validateResolveIncident = [
  param('id')
    .isMongoId().withMessage('Invalid incident ID'),
  
  body('resolutionNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Resolution notes cannot exceed 1000 characters'),
  
  body('actionTaken')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Action taken cannot exceed 500 characters')
];

// Validation rules for query parameters
const validateQueryParams = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  query('status')
    .optional()
    .isIn(Object.values(INCIDENT_STATUS)).withMessage('Invalid status'),
  
  query('type')
    .optional()
    .isIn(Object.values(INCIDENT_TYPES)).withMessage('Invalid incident type'),
  
  query('severity')
    .optional()
    .isIn(Object.values(SEVERITY)).withMessage('Invalid severity level'),
  
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format')
];

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errorMessages,
      timestamp: new Date().toISOString()
    });
  }
  next();
};

module.exports = {
  validateCreateIncident,
  validateUpdateIncident,
  validateAddNote,
  validateAddEvidence,
  validateAssignIncident,
  validateResolveIncident,
  validateQueryParams,
  validate
};