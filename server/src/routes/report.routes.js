const express = require('express');
const router = express.Router();

const reportController = require('../controllers/report.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { USER_ROLES } = require('../config/constants');

// All routes require authentication
router.use(protect);

// GET report statistics
router.get('/statistics', reportController.getReportStatistics);

// POST create report
router.post('/', reportController.createReport);

// GET all reports
router.get('/', reportController.getAllReports);

// GET report by ID
router.get('/:id', reportController.getReportById);

// GET download report
router.get('/:id/download', reportController.downloadReport);

// POST schedule report
router.post('/:id/schedule', reportController.scheduleReport);

// DELETE report
router.delete('/:id', reportController.deleteReport);

module.exports = router;