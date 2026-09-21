const { body, param, query, validationResult } = require('express-validator');
const { ALERT_TYPES, ALERT_PRIORITY } = require('../config/constants');

// Validation rules for creating alert
const validateCreateAlert = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),

  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 5, max: 1000 })
    .withMessage('Message must be between 5 and 1000 characters'),

  body('type')
    .optional()
    .isIn(Object.values(ALERT_TYPES))
    .withMessage('Invalid alert type'),

  body('priority')
    .optional()
    .isIn(Object.values(ALERT_PRIORITY))
    .withMessage('Invalid priority level'),

  body('incidentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid incident ID'),

  body('cameraId')
    .optional()
    .isMongoId()
    .withMessage('Invalid camera ID'),

  body('recipients')
    .optional()
    .isArray()
    .withMessage('Recipients must be an array')
    .custom((value) => {
      if (value && value.length > 0) {
        const allValid = value.every((id) => {
          try {
            return typeof id === 'string' &&
              /^[0-9a-fA-F]{24}$/.test(id);
          } catch {
            return false;
          }
        });

        if (!allValid) {
          throw new Error('Invalid user ID in recipients');
        }
      }

      return true;
    }),

  body('channels')
    .optional()
    .isArray()
    .withMessage('Channels must be an array')
    .custom((value) => {
      if (value && value.length > 0) {
        const validChannels = [
          'email',
          'sms',
          'push',
          'in_app',
          'socket'
        ];

        const allValid = value.every((channel) =>
          validChannels.includes(channel)
        );

        if (!allValid) {
          throw new Error(
            'Invalid channel. Must be email, sms, push, in_app, or socket'
          );
        }
      }

      return true;
    })
];

// Validation rules for marking alert as read
const validateMarkRead = [
  param('id')
    .isMongoId()
    .withMessage('Invalid alert ID')
];

// Validation rules for acknowledging alert
const validateAcknowledge = [
  param('id')
    .isMongoId()
    .withMessage('Invalid alert ID')
];

// Validation rules for query parameters
const validateQueryParams = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  // "unread" is a virtual filter.
  // It is not stored in MongoDB as a recipient status.
  query('status')
    .optional()
    .isIn([
      'pending',
      'sent',
      'delivered',
      'read',
      'failed',
      'unread'
    ])
    .withMessage(
      'Invalid status. Must be pending, sent, delivered, read, failed, or unread'
    ),

  query('priority')
    .optional()
    .isIn(Object.values(ALERT_PRIORITY))
    .withMessage('Invalid priority'),

  query('type')
    .optional()
    .isIn(Object.values(ALERT_TYPES))
    .withMessage('Invalid alert type')
];

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(
      (error) => error.msg
    );

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
  validateCreateAlert,
  validateMarkRead,
  validateAcknowledge,
  validateQueryParams,
  validate
};