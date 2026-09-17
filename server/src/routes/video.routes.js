const express = require('express');
const router = express.Router();

const videoController = require('../controllers/video.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { uploadVideo, handleMulterError } = require('../config/multer');
const { USER_ROLES } = require('../config/constants');

// All routes require authentication
router.use(protect);

// GET video statistics
router.get('/statistics', videoController.getVideoStatistics);

// POST upload video
router.post(
  '/upload',
  uploadVideo.single('video'),
  handleMulterError,
  videoController.uploadVideo
);

// GET all videos with filters
router.get('/', videoController.getAllVideos);

// GET video by ID
router.get('/:id', videoController.getVideoById);

// GET stream video
router.get('/:id/stream', videoController.streamVideo);

// GET download video
router.get('/:id/download', videoController.downloadVideo);

// PUT update video
router.put(
  '/:id',
  restrictTo(USER_ROLES.ADMIN, USER_ROLES.OPERATOR),
  videoController.updateVideo
);

// DELETE video
router.delete(
  '/:id',
  restrictTo(USER_ROLES.ADMIN),
  videoController.deleteVideo
);

module.exports = router;