const express = require('express');
const router = express.Router();

const alertController = require('../controllers/alert.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  validateCreateAlert,
  validateMarkRead,
  validateAcknowledge,
  validateQueryParams,
  validate
} = require('../validators/alert.validator');
const { USER_ROLES } = require('../config/constants');

// All routes require authentication
router.use(protect);

// GET alert statistics
router.get('/statistics', alertController.getAlertStatistics);

// GET all alerts for current user
router.get('/', validateQueryParams, validate, alertController.getMyAlerts);

// POST create alert
router.post(
  '/',
  restrictTo(USER_ROLES.ADMIN, USER_ROLES.OPERATOR),
  validateCreateAlert,
  validate,
  alertController.createAlert
);

// POST mark all as read
router.post('/mark-all-read', alertController.markAllAlertsAsRead);

// GET alert by ID
router.get('/:id', alertController.getAlertById);

// POST mark alert as read
router.post(
  '/:id/read',
  validateMarkRead,
  validate,
  alertController.markAlertAsRead
);

// POST acknowledge alert
router.post(
  '/:id/acknowledge',
  validateAcknowledge,
  validate,
  alertController.acknowledgeAlert
);

// DELETE alert
router.delete(
  '/:id',
  restrictTo(USER_ROLES.ADMIN),
  alertController.deleteAlert
);

module.exports = router;