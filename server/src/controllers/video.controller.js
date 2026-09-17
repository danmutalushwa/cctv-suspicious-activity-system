const Video = require('../models/Video');
const Incident = require('../models/Incident');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');
const videoService = require('../services/video.service');
const aiService = require('../services/ai.service');
const aiIncidentService = require('../services/ai-incident.service');
const fs = require('fs');
const path = require('path');

/**
 * Upload video
 */
const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return ApiResponse.badRequest(res, 'No video file uploaded');
    }

    const { title, description, incidentId, cameraId, isPublic } = req.body;

    // Validate video
    const validation = await videoService.validateVideo(req.file.path);

    if (!validation.valid) {
      await videoService.deleteVideoFile(req.file.path);

      return ApiResponse.badRequest(
        res,
        `Invalid video: ${
          validation.errors?.join(', ') || validation.error
        }`
      );
    }

    // Create video record
    const videoData = {
      title: title || req.file.originalname,
      description: description || '',
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      path: req.file.path,
      uploadedBy: req.userId,
      status: 'processing',
      isPublic: isPublic === 'true' || isPublic === true
    };

    // Add incident reference if provided
    if (incidentId) {
      const incident = await Incident.findById(incidentId);

      if (incident) {
        videoData.incidentId = incidentId;
      }
    }

    // Add camera reference if provided
    if (cameraId) {
      videoData.cameraId = cameraId;
    }

    const video = await Video.create(videoData);

    /*
     * Start video processing in the background.
     *
     * This includes:
     * 1. Metadata extraction
     * 2. Thumbnail generation
     * 3. AI frame extraction
     * 4. AI suspicious-activity analysis
     * 5. Temporary frame cleanup
     *
     * We intentionally do not await this function because
     * the user should receive the upload response immediately.
     */
    processVideoAsync(video._id, req.file.path, video);

    logger.info(
      `Video uploaded: ${video.filename} by ${req.user.email}`
    );

    ApiResponse.created(
      res,
      {
        video,
        message: 'Video uploaded successfully. Processing in background.'
      },
      'Video upload initiated'
    );
  } catch (error) {
    logger.error('Upload video error:', error);

    // Delete uploaded file if an error occurs
    if (req.file && req.file.path) {
      await videoService.deleteVideoFile(req.file.path);
    }

    ApiResponse.error(
      res,
      error,
      'Failed to upload video'
    );
  }
};

/**
 * Process video asynchronously
 *
 * Processing pipeline:
 *
 * Video
 *   ↓
 * Extract metadata
 *   ↓
 * Generate thumbnail
 *   ↓
 * Extract frames
 *   ↓
 * Send frames to Python AI service
 *   ↓
 * Detect suspicious activities
 *   ↓
 * Collect AI results
 *   ↓
 * Clean temporary frames
 *
 * NOTE:
 * We are not creating incidents or alerts yet.
 * That will be added after the AI pipeline is verified.
 */
const processVideoAsync = async (videoId, filePath, video) => {
  let frameDir = null;

  try {
    logger.info(
      `Starting video processing: ${video.filename}`
    );

    // --------------------------------------------------
    // 1. Extract video metadata
    // --------------------------------------------------

    const metadata = await videoService.extractVideoMetadata(
      filePath
    );

    logger.info(
      `Video metadata extracted: ${video.filename}`
    );

    // --------------------------------------------------
    // 2. Generate thumbnail
    // --------------------------------------------------

    const uploadDir = path.dirname(filePath);

    const thumbnailPath = await videoService.generateThumbnail(
      filePath,
      uploadDir,
      {
        size: '320x240',
        timestamp: Math.min(
          metadata.duration / 2,
          5
        ),
        filename: `${path.basename(
          filePath,
          path.extname(filePath)
        )}-thumb.jpg`
      }
    );

    logger.info(
      `Video thumbnail generated: ${thumbnailPath}`
    );

    // --------------------------------------------------
    // 3. Create temporary directory for AI frames
    // --------------------------------------------------

    frameDir = path.join(
      uploadDir,
      `${path.basename(
        filePath,
        path.extname(filePath)
      )}-ai-frames`
    );

    // --------------------------------------------------
    // 4. Extract frames for AI analysis
    // --------------------------------------------------

    logger.info(
      `Extracting frames for AI analysis: ${video.filename}`
    );

    const framePaths = await videoService.extractFramesForAI(
      filePath,
      frameDir,
      {
        interval: 2,
        maxFrames: 300,
        imageSize: '640x360'
      }
    );

    logger.info(
      `Extracted ${framePaths.length} AI frames from ${video.filename}`
    );

    // --------------------------------------------------
    // 5. Send extracted frames to Python AI service
    // --------------------------------------------------

    let aiResults = [];

    if (framePaths.length > 0) {
      logger.info(
        `Starting AI analysis for ${framePaths.length} frames`
      );

      aiResults = await aiService.analyzeFrames(
        framePaths
      );

      logger.info(
        `Row AI results: ${JSON.stringify(aiResults, null, 2)}`
      );

      logger.info(
        `AI analysis completed for ${video.filename}`
      );
    } else {
      logger.warn(
        `No frames extracted for AI analysis: ${video.filename}`
      );
    }

    // --------------------------------------------------
    // 6. Find suspicious results
    // --------------------------------------------------

    const suspiciousResults = aiResults.filter(
      result =>
        result &&
        result.success &&
        result.is_suspicious === true &&
        Array.isArray(result.suspicious_activities) &&
        result.suspicious_activities.length > 0
    );

    // --------------------------------------------------
    // Create incidents from suspicious AI results
    // --------------------------------------------------

    let createdIncidents = [];

    if (suspiciousResults.length > 0) {
      logger.info(
        `Creating incidents from ${suspiciousResults.length} suspicious AI results`
      );

      createdIncidents =
        await aiIncidentService.processAIResults({
          aiResults: suspiciousResults,
          video
        });

      logger.info(
        `Created ${createdIncidents.length} incidents from AI analysis`
      );
    }

    logger.info(
      `AI detected ${suspiciousResults.length} suspicious frames for ${video.filename}`
    );

    // --------------------------------------------------
    // 7. Log suspicious activity summary
    // --------------------------------------------------

    if (suspiciousResults.length > 0) {
      logger.warn(
        `Suspicious activity detected in video: ${video.filename}`
      );

      suspiciousResults.forEach((result, index) => {
        logger.warn(
          `Suspicious result ${index + 1}: ${JSON.stringify(
            result.suspicious_activities
          )}`
        );
      });
    } else {
      logger.info(
        `No suspicious activity detected in video: ${video.filename}`
      );
    }

    // --------------------------------------------------
    // 8. Update video record
    // --------------------------------------------------

    await Video.findByIdAndUpdate(videoId, {
      status: 'completed',

      duration: metadata.duration,

      resolution: metadata.video
        ? {
            width: metadata.video.width,
            height: metadata.video.height
          }
        : null,

      framerate: metadata.video?.framerate,

      bitrate: metadata.bitrate,

      codec: metadata.video?.codec,

      thumbnailPath: thumbnailPath
    });

    logger.info(
      `Video processed successfully: ${video.filename}`
    );

    // --------------------------------------------------
    // 9. Return processing result
    // --------------------------------------------------

    return {
      success: true,
      videoId,
      frameCount: framePaths.length,
      aiResultsCount: aiResults.length,
      suspiciousResultsCount: suspiciousResults.length,
      incidentsCreated: createdIncidents.length
    };
  } catch (error) {
    logger.error(
      `Video processing failed for ${video.filename}:`,
      error
    );

    // Mark video as failed
    try {
      await Video.findByIdAndUpdate(videoId, {
        status: 'failed',
        processingError: error.message
      });
    } catch (updateError) {
      logger.error(
        `Failed to update video processing status: ${updateError.message}`
      );
    }

    return {
      success: false,
      videoId,
      error: error.message
    };
  } finally {
    // --------------------------------------------------
    // 10. Clean up temporary AI frames
    // --------------------------------------------------

    if (frameDir) {
      logger.info(
        `AI frames retained temporarily for debugging: ${frameDir}`
      );
    }
  }
};

/**
 * Get all videos with pagination
 */
const getAllVideos = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      cameraId,
      incidentId,
      search,
      startDate,
      endDate
    } = req.query;

    const filter = {
      isDeleted: false
    };

    if (status) {
      filter.status = status;
    }

    if (cameraId) {
      filter.cameraId = cameraId;
    }

    if (incidentId) {
      filter.incidentId = incidentId;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Search in title, description and original filename
    if (search) {
      filter.$or = [
        {
          title: {
            $regex: search,
            $options: 'i'
          }
        },
        {
          description: {
            $regex: search,
            $options: 'i'
          }
        },
        {
          originalName: {
            $regex: search,
            $options: 'i'
          }
        }
      ];
    }

    const skip = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      Video.find(filter)
        .populate('uploadedBy', 'name email')
        .populate('cameraId', 'name location')
        .populate(
          'incidentId',
          'incidentNumber title type'
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),

      Video.countDocuments(filter)
    ]);

    ApiResponse.success(
      res,
      {
        videos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      },
      'Videos retrieved successfully'
    );
  } catch (error) {
    logger.error('Get videos error:', error);

    ApiResponse.error(
      res,
      error,
      'Failed to retrieve videos'
    );
  }
};

/**
 * Get video by ID
 */
const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id)
      .populate('uploadedBy', 'name email')
      .populate('cameraId', 'name location')
      .populate(
        'incidentId',
        'incidentNumber title type severity'
      );

    if (!video || video.isDeleted) {
      return ApiResponse.notFound(
        res,
        'Video not found'
      );
    }

    // Increment view count
    await video.incrementViews();

    ApiResponse.success(
      res,
      {
        video
      },
      'Video retrieved successfully'
    );
  } catch (error) {
    logger.error('Get video error:', error);

    ApiResponse.error(
      res,
      error,
      'Failed to retrieve video'
    );
  }
};

/**
 * Stream video
 */
const streamVideo = async (req, res) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id);

    if (!video || video.isDeleted) {
      return ApiResponse.notFound(
        res,
        'Video not found'
      );
    }

    const filePath = video.path;

    // Check that file exists
    if (!fs.existsSync(filePath)) {
      return ApiResponse.notFound(
        res,
        'Video file not found'
      );
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Parse range header
      const parts = range
        .replace(/bytes=/, '')
        .split('-');

      const start = parseInt(parts[0], 10);

      const end = parts[1]
        ? parseInt(parts[1], 10)
        : fileSize - 1;

      const chunksize =
        end - start + 1;

      const file = fs.createReadStream(
        filePath,
        {
          start,
          end
        }
      );

      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': video.mimeType
      };

      res.writeHead(206, head);

      file.pipe(res);
    } else {
      // No range header
      const head = {
        'Content-Length': fileSize,
        'Content-Type': video.mimeType
      };

      res.writeHead(200, head);

      fs.createReadStream(filePath).pipe(res);
    }

    // Increment download count
    await video.incrementDownloads();
  } catch (error) {
    logger.error(
      'Stream video error:',
      error
    );

    if (!res.headersSent) {
      ApiResponse.error(
        res,
        error,
        'Failed to stream video'
      );
    }
  }
};

/**
 * Download video
 */
const downloadVideo = async (req, res) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id);

    if (!video || video.isDeleted) {
      return ApiResponse.notFound(
        res,
        'Video not found'
      );
    }

    const filePath = video.path;

    if (!fs.existsSync(filePath)) {
      return ApiResponse.notFound(
        res,
        'Video file not found'
      );
    }

    res.download(
      filePath,
      video.originalName,
      async err => {
        if (err) {
          logger.error(
            'Download video error:',
            err
          );

          if (!res.headersSent) {
            ApiResponse.error(
              res,
              err,
              'Failed to download video'
            );
          }
        } else {
          await video.incrementDownloads();

          logger.info(
            `Video downloaded: ${video.filename} by ${req.user.email}`
          );
        }
      }
    );
  } catch (error) {
    logger.error(
      'Download video error:',
      error
    );

    ApiResponse.error(
      res,
      error,
      'Failed to download video'
    );
  }
};

/**
 * Update video metadata
 */
const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      isPublic,
      tags
    } = req.body;

    const video = await Video.findById(id);

    if (!video || video.isDeleted) {
      return ApiResponse.notFound(
        res,
        'Video not found'
      );
    }

    if (title) {
      video.title = title;
    }

    if (description) {
      video.description = description;
    }

    if (isPublic !== undefined) {
      video.isPublic = isPublic;
    }

    if (tags) {
      video.metadata.tags = tags;
    }

    await video.save();

    ApiResponse.success(
      res,
      {
        video
      },
      'Video updated successfully'
    );
  } catch (error) {
    logger.error(
      'Update video error:',
      error
    );

    ApiResponse.error(
      res,
      error,
      'Failed to update video'
    );
  }
};

/**
 * Delete video
 */
const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id);

    if (!video || video.isDeleted) {
      return ApiResponse.notFound(
        res,
        'Video not found'
      );
    }

    // Soft delete
    video.isDeleted = true;

    await video.save();

    // Optionally delete physical files
    // await videoService.deleteVideoFile(video.path);

    // if (video.thumbnailPath) {
    //   await videoService.deleteVideoFile(
    //     video.thumbnailPath
    //   );
    // }

    logger.info(
      `Video deleted: ${video.filename} by ${req.user.email}`
    );

    ApiResponse.success(
      res,
      null,
      'Video deleted successfully'
    );
  } catch (error) {
    logger.error(
      'Delete video error:',
      error
    );

    ApiResponse.error(
      res,
      error,
      'Failed to delete video'
    );
  }
};

/**
 * Get video statistics
 */
const getVideoStatistics = async (req, res) => {
  try {
    const stats = await Video.getStatistics();

    // Get total storage used
    const totalSize = await Video.aggregate([
      {
        $match: {
          isDeleted: false
        }
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: '$fileSize'
          }
        }
      }
    ]);

    const statistics = {
      total:
        stats[0].total[0]?.count || 0,

      totalSize:
        totalSize[0]?.total || 0,

      totalSizeMB:
        (
          (totalSize[0]?.total || 0) /
          (1024 * 1024)
        ).toFixed(2),

      byCamera:
        stats[0].byCamera || [],

      byStatus:
        stats[0].byStatus || [],

      recent:
        stats[0].recent || []
    };

    ApiResponse.success(
      res,
      statistics,
      'Video statistics retrieved successfully'
    );
  } catch (error) {
    logger.error(
      'Get video statistics error:',
      error
    );

    ApiResponse.error(
      res,
      error,
      'Failed to retrieve statistics'
    );
  }
};

module.exports = {
  uploadVideo,
  getAllVideos,
  getVideoById,
  streamVideo,
  downloadVideo,
  updateVideo,
  deleteVideo,
  getVideoStatistics
};