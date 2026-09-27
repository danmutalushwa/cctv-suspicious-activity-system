const express = require('express');
const router = express.Router();

const aiController = require('../controllers/ai.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { upload } = require('../config/multer');
const { USER_ROLES } = require('../config/constants');

// All AI routes require authentication
router.use(protect);

router.get('/health', aiController.checkHealth);
router.get('/model-info', aiController.getModelInfo);

router.post(
  '/analyze',
  upload.single('image'),
  aiController.analyzeImage
);

router.post(
  '/analyze-and-report',
  restrictTo(USER_ROLES.ADMIN, USER_ROLES.OPERATOR),
  upload.single('image'),
  aiController.analyzeAndReport
);

module.exports = router;