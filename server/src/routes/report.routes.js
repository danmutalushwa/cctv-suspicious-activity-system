const express = require('express');
const router = express.Router();

const reportController = require('../controllers/report.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { USER_ROLES } = require('../config/constants');

// All routes require authentication
router.use(protect);

// 1. Static paths go first
router.get('/statistics', reportController.getReportStatistics);

// 2. Base resource mutations
router.post('/', reportController.createReport);
router.get('/', reportController.getAllReports);

// 3. Multi-tier specific routes (MUST be above the generic /:id wildcard)
router.get('/:id/download', reportController.downloadReport);
router.post('/:id/schedule', reportController.scheduleReport);

// 4. Generic single-tier parameter wildcards go last
router.get('/:id', reportController.getReportById);
router.delete('/:id', reportController.deleteReport);

module.exports = router;
