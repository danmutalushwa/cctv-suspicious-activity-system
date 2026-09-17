const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { USER_ROLES } = require('../config/constants');

// All routes require authentication
router.use(protect);

// GET dashboard statistics
router.get('/stats', dashboardController.getDashboardStats);

// GET real-time monitoring data
router.get('/realtime', dashboardController.getRealTimeData);

// GET system health (admin only)
router.get('/health', restrictTo(USER_ROLES.ADMIN), dashboardController.getSystemHealth);

// GET activity timeline
router.get('/timeline', dashboardController.getActivityTimeline);

// GET top performers
router.get('/performers', dashboardController.getTopPerformers);

// GET heatmap data
router.get('/heatmap', dashboardController.getHeatmapData);

module.exports = router;