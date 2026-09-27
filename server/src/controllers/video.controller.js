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
 * ---------------------------------------------------------
 * Helper: Convert a server filesystem path into a browser URL
 * ---------------------------------------------------------
 *
 * Example:
 *
 * Windows path:
 * E:\cctv-suspicious-activity-system\server\uploads\videos\abc-thumb.jpg
 *
 * Browser URL:
 * http://localhost:5000/uploads/videos/abc-thumb.jpg
 */
const getUploadUrl = (req, filePath) => {
  if (!filePath) {
    return null;
  }

  try {
    const uploadsRoot = path.resolve(
      __dirname,
      '../../uploads'
    );

    const absoluteFilePath = path.resolve(filePath);

    const relativePath = path
      .relative(uploadsRoot, absoluteFilePath)
      .replace(/\\/g, '/');

    // Prevent files outside the uploads directory
    if (
      relativePath.startsWith('../') ||
      path.isAbsolute(relativePath)
    ) {
      return null;
    }

    return `${req.protocol}://${req.get('host')}/uploads/${relativePath}`;
  } catch (error) {
    logger.error(
      `Failed to create upload URL: ${error.message}`
    );

    return null;
  }
};

/**
 * ---------------------------------------------------------
 * Upload video
 * ---------------------------------------------------------
 */
const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return ApiResponse.badRequest(
        res,
        'No video file uploaded'
      );
    }

    const {
      title,
      description,
      incidentId,
      cameraId,
      isPublic
    } = req.body;

    // Validate video
    const validation = await videoService.validateVideo(
      req.file.path
    );

    if (!validation.valid) {
      await videoService.deleteVideoFile(
        req.file.path
      );

      return ApiResponse.badRequest(
        res,
        `Invalid video: ${
          validation.errors?.join(', ') ||
          validation.error
        }`
      );
    }

    // Create video record
    const videoData = {
      title:
        title ||
        req.file.originalname,

      description:
        description || '',

      filename:
        req.file.filename,

      originalName:
        req.file.originalname,

      fileSize:
        req.file.size,

      mimeType:
        req.file.mimetype,

      path:
        req.file.path,

      uploadedBy:
        req.userId,

      status:
        'processing',

      isPublic:
        isPublic === 'true' ||
        isPublic === true
    };

    // Incident reference
    if (incidentId) {
      const incident =
        await Incident.findById(
          incidentId
        );

      if (incident) {
        videoData.incidentId =
          incidentId;
      }
    }

    // Camera reference
    if (cameraId) {
      videoData.cameraId =
        cameraId;
    }

    const video =
      await Video.create(videoData);

    /**
     * Start processing in background.
     */
    processVideoAsync(
      video._id,
      req.file.path,
      video
    );

    logger.info(
      `Video uploaded: ${video.filename} by ${req.user.email}`
    );

    return ApiResponse.created(
      res,
      {
        video,
        message:
          'Video uploaded successfully. Processing in background.'
      },
      'Video upload initiated'
    );
  } catch (error) {
    logger.error(
      'Upload video error:',
      error
    );

    if (
      req.file &&
      req.file.path
    ) {
      await videoService.deleteVideoFile(
        req.file.path
      );
    }

    return ApiResponse.error(
      res,
      error,
      'Failed to upload video'
    );
  }
};

/**
 * ---------------------------------------------------------
 * Process video asynchronously
 * ---------------------------------------------------------
 */
const processVideoAsync = async (
  videoId,
  filePath,
  video
) => {
  let frameDir = null;

  try {
    logger.info(
      `Starting video processing: ${video.filename}`
    );

    // 1. Extract metadata
    const metadata =
      await videoService.extractVideoMetadata(
        filePath
      );

    logger.info(
      `Video metadata extracted: ${video.filename}`
    );

    // 2. Generate thumbnail
    const uploadDir =
      path.dirname(filePath);

    const thumbnailPath =
      await videoService.generateThumbnail(
        filePath,
        uploadDir,
        {
          size: '320x240',

          timestamp:
            Math.min(
              metadata.duration / 2,
              5
            ),

          filename:
            `${path.basename(
              filePath,
              path.extname(filePath)
            )}-thumb.jpg`
        }
      );

    logger.info(
      `Video thumbnail generated: ${thumbnailPath}`
    );

    // 3. Create temporary AI frame directory
    frameDir = path.join(
      uploadDir,
      `${path.basename(
        filePath,
        path.extname(filePath)
      )}-ai-frames`
    );

    // 4. Extract frames
    logger.info(
      `Extracting frames for AI analysis: ${video.filename}`
    );

    const framePaths =
      await videoService.extractFramesForAI(
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

    // 5. AI analysis
    let aiResults = [];

    await Video.findByIdAndUpdate(videoId, {
      'aiAnalysis.status': 'processing'
    });

    if (framePaths.length > 0) {
      logger.info(
        `Starting AI analysis for ${framePaths.length} frames`
      );

      aiResults =
        await aiService.analyzeFrames(
          framePaths
        );

      logger.info(
        `AI analysis completed for ${video.filename}`
      );
    } else {
      logger.warn(
        `No frames extracted for AI analysis: ${video.filename}`
      );
    }

    // 6. Find suspicious results
    const suspiciousResults =
      aiResults.filter(
        result =>
          result &&
          result.success &&
          result.is_suspicious === true &&
          Array.isArray(
            result.suspicious_activities
          ) &&
          result.suspicious_activities.length > 0
      );
      // Build AI analysis summary
      const allActivities = [];

      const detectionResults = [];

      suspiciousResults.forEach((result, index) => {
        const framePath = framePaths[index];

        result.suspicious_activities.forEach(activity => {
          if (Array.isArray(activity.activities)) {
            allActivities.push(...activity.activities);
          }

          detectionResults.push({
            frame: framePath
              ? path.basename(framePath)
              : `frame-${index + 1}`,

            activities: activity.activities || [],

            severity: activity.severity || 'low',

            confidence: activity.confidence || 0,

            trackId: activity.track_id ?? null,

            bbox: activity.bbox || [],

            zone: activity.zone || null
          });
        });
      });

      const uniqueActivities = [
        ...new Set(allActivities)
      ];

      const severityRank = {
        low: 0,
        medium: 1,
        high: 2,
        critical: 3
      };

      let overallSeverity = 'low';

      for (const result of suspiciousResults) {
        const severity = result.overall_severity || 'low';

        if (
          severityRank[severity] >
          severityRank[overallSeverity]
        ) {
          overallSeverity = severity;
        }
      }

    // 7. Create incidents
    let createdIncidents = [];

    if (
      suspiciousResults.length > 0
    ) {
      logger.info(
        `Creating incidents from ${suspiciousResults.length} suspicious AI results`
      );

      createdIncidents =
        await aiIncidentService.processAIResults(
          {
            aiResults:
              suspiciousResults,

            video
          }
        );

      logger.info(
        `Created ${createdIncidents.length} incidents from AI analysis`
      );
    }

    logger.info(
      `AI detected ${suspiciousResults.length} suspicious frames for ${video.filename}`
    );

    // 8. Log results
    if (
      suspiciousResults.length > 0
    ) {
      logger.warn(
        `Suspicious activity detected in video: ${video.filename}`
      );

      suspiciousResults.forEach(
        (result, index) => {
          logger.warn(
            `Suspicious result ${index + 1}: ${JSON.stringify(
              result.suspicious_activities
            )}`
          );
        }
      );
    } else {
      logger.info(
        `No suspicious activity detected in video: ${video.filename}`
      );
    }

    // 9. Update video
   await Video.findByIdAndUpdate(
      videoId,
      {
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

        thumbnailPath: thumbnailPath,

        aiAnalysis: {
          status: 'completed',

          frameCount: framePaths.length,

          analyzedFrames: aiResults.length,

          suspiciousFrames:
            suspiciousResults.length,

          incidentsCreated:
            createdIncidents.length,

          overallSeverity,

          activities: uniqueActivities,

          detections: detectionResults,

          model: 'yolov8n',

          processedAt: new Date()
        }
      }
    );
    logger.info(
      `Video processed successfully: ${video.filename}`
    );

    return {
      success: true,
      videoId,
      frameCount:
        framePaths.length,
      aiResultsCount:
        aiResults.length,
      suspiciousResultsCount:
        suspiciousResults.length,
      incidentsCreated:
        createdIncidents.length
    };
  } catch (error) {
    logger.error(
      `Video processing failed for ${video.filename}:`,
      error
    );

    try {
      await Video.findByIdAndUpdate(
        videoId,
        {
          status: 'failed',
          processingError: error.message,
          'aiAnalysis.status': 'failed',
          'aiAnalysis.error': error.message,
          'aiAnalysis.processedAt': new Date()
        }
      );
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
    if (frameDir) {
      logger.info(
        `AI frames retained temporarily for debugging: ${frameDir}`
      );
    }
  }
};

/**
 * ---------------------------------------------------------
 * Get all videos
 * ---------------------------------------------------------
 */
const getAllVideos = async (
  req,
  res
) => {
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

    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate) {
        filter.createdAt.$gte =
          new Date(startDate);
      }

      if (endDate) {
        filter.createdAt.$lte =
          new Date(endDate);
      }
    }

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

    const skip =
      (page - 1) * limit;

    const [
      videos,
      total
    ] = await Promise.all([
      Video.find(filter)
        .populate(
          'uploadedBy',
          'name email'
        )
        .populate(
          'cameraId',
          'name location'
        )
        .populate(
          'incidentId',
          'incidentNumber title type'
        )
        .sort({
          createdAt: -1
        })
        .skip(skip)
        .limit(
          parseInt(limit)
        ),

      Video.countDocuments(filter)
    ]);

    // Add browser URLs
    const videosWithUrls =
      videos.map(video => {
        const videoObject =
          video.toObject();

        videoObject.streamUrl =
          `${req.protocol}://${req.get(
            'host'
          )}/api/videos/${video._id}/stream`;

        videoObject.downloadUrl =
          `${req.protocol}://${req.get(
            'host'
          )}/api/videos/${video._id}/download`;

        videoObject.thumbnailUrl =
          getUploadUrl(
            req,
            video.thumbnailPath
          );

        return videoObject;
      });

    return ApiResponse.success(
      res,
      {
        videos:
          videosWithUrls,

        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages:
            Math.ceil(
              total / limit
            )
        }
      },
      'Videos retrieved successfully'
    );
  } catch (error) {
    logger.error(
      'Get videos error:',
      error
    );

    return ApiResponse.error(
      res,
      error,
      'Failed to retrieve videos'
    );
  }
};

/**
 * ---------------------------------------------------------
 * Get video by ID
 * ---------------------------------------------------------
 */
const getVideoById = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const video =
      await Video.findById(id)
        .populate(
          'uploadedBy',
          'name email'
        )
        .populate(
          'cameraId',
          'name location'
        )
        .populate(
          'incidentId',
          'incidentNumber title type severity'
        );

    if (
      !video ||
      video.isDeleted
    ) {
      return ApiResponse.notFound(
        res,
        'Video not found'
      );
    }

    await video.incrementViews();

    const videoObject =
      video.toObject();

    // Browser URLs
    videoObject.streamUrl =
      `${req.protocol}://${req.get(
        'host'
      )}/api/videos/${video._id}/stream`;

    videoObject.downloadUrl =
      `${req.protocol}://${req.get(
        'host'
      )}/api/videos/${video._id}/download`;

    videoObject.thumbnailUrl =
      getUploadUrl(
        req,
        video.thumbnailPath
      );

    return ApiResponse.success(
      res,
      {
        video:
          videoObject
      },
      'Video retrieved successfully'
    );
  } catch (error) {
    logger.error(
      'Get video error:',
      error
    );

    return ApiResponse.error(
      res,
      error,
      'Failed to retrieve video'
    );
  }
};

/**
 * ---------------------------------------------------------
 * Stream video
 * ---------------------------------------------------------
 */
const streamVideo = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const video =
      await Video.findById(id);

    if (
      !video ||
      video.isDeleted
    ) {
      return ApiResponse.notFound(
        res,
        'Video not found'
      );
    }

    const filePath =
      video.path;

    if (
      !filePath ||
      !fs.existsSync(filePath)
    ) {
      logger.error(
        `Video file does not exist: ${filePath}`
      );

      return ApiResponse.notFound(
        res,
        'Video file not found'
      );
    }

    const stat =
      fs.statSync(filePath);

    const fileSize =
      stat.size;

    const range =
      req.headers.range;

    /*
     * IMPORTANT:
     * These headers allow the browser to
     * play a cross-origin video stream.
     */
    res.setHeader(
      'Access-Control-Allow-Origin',
      'http://localhost:3000'
    );

    res.setHeader(
      'Access-Control-Allow-Credentials',
      'true'
    );

    res.setHeader(
      'Cross-Origin-Resource-Policy',
      'cross-origin'
    );

    res.setHeader(
      'Accept-Ranges',
      'bytes'
    );

    res.setHeader(
      'Content-Disposition',
      'inline'
    );

    res.setHeader(
      'Cache-Control',
      'no-cache'
    );

    /*
     * Browser requested a specific range.
     */
    if (range) {
      const parts =
        range
          .replace(/bytes=/, '')
          .split('-');

      let start =
        parseInt(parts[0], 10);

      let end =
        parts[1]
          ? parseInt(parts[1], 10)
          : fileSize - 1;

      // Validate range
      if (
        Number.isNaN(start) ||
        start < 0
      ) {
        start = 0;
      }

      if (
        Number.isNaN(end) ||
        end >= fileSize
      ) {
        end = fileSize - 1;
      }

      if (start > end) {
        res.status(416);

        res.setHeader(
          'Content-Range',
          `bytes */${fileSize}`
        );

        return res.end();
      }

      const chunksize =
        end - start + 1;

      res.status(206);

      res.setHeader(
        'Content-Range',
        `bytes ${start}-${end}/${fileSize}`
      );

      res.setHeader(
        'Content-Length',
        chunksize
      );

      res.setHeader(
        'Content-Type',
        video.mimeType ||
          'video/mp4'
      );

      const file =
        fs.createReadStream(
          filePath,
          {
            start,
            end
          }
        );

      file.on(
        'error',
        error => {
          logger.error(
            'Video stream error:',
            error
          );

          if (
            !res.headersSent
          ) {
            res.status(500);
          }

          res.end();
        }
      );

      file.pipe(res);
    } else {
      /*
       * Browser did not send a Range header.
       */
      res.status(200);

      res.setHeader(
        'Content-Length',
        fileSize
      );

      res.setHeader(
        'Content-Type',
        video.mimeType ||
          'video/mp4'
      );

      const file =
        fs.createReadStream(
          filePath
        );

      file.on(
        'error',
        error => {
          logger.error(
            'Video stream error:',
            error
          );

          if (
            !res.headersSent
          ) {
            res.status(500);
          }

          res.end();
        }
      );

      file.pipe(res);
    }

    // Count stream as a download/view
    try {
      await video.incrementDownloads();
    } catch (error) {
      logger.warn(
        `Failed to increment video download count: ${error.message}`
      );
    }
  } catch (error) {
    logger.error(
      'Stream video error:',
      error
    );

    if (
      !res.headersSent
    ) {
      return ApiResponse.error(
        res,
        error,
        'Failed to stream video'
      );
    }

    res.end();
  }
};

/**
 * ---------------------------------------------------------
 * Download video
 * ---------------------------------------------------------
 */
const downloadVideo = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const video =
      await Video.findById(id);

    if (
      !video ||
      video.isDeleted
    ) {
      return ApiResponse.notFound(
        res,
        'Video not found'
      );
    }

    const filePath =
      video.path;

    if (
      !fs.existsSync(filePath)
    ) {
      return ApiResponse.notFound(
        res,
        'Video file not found'
      );
    }

    res.download(
      filePath,
      video.originalName,
      async error => {
        if (error) {
          logger.error(
            'Download video error:',
            error
          );

          if (
            !res.headersSent
          ) {
            ApiResponse.error(
              res,
              error,
              'Failed to download video'
            );
          }

          return;
        }

        try {
          await video.incrementDownloads();

          logger.info(
            `Video downloaded: ${video.filename} by ${req.user.email}`
          );
        } catch (countError) {
          logger.warn(
            `Failed to increment download count: ${countError.message}`
          );
        }
      }
    );
  } catch (error) {
    logger.error(
      'Download video error:',
      error
    );

    return ApiResponse.error(
      res,
      error,
      'Failed to download video'
    );
  }
};

/**
 * ---------------------------------------------------------
 * Update video metadata
 * ---------------------------------------------------------
 */
const updateVideo = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const {
      title,
      description,
      isPublic,
      tags
    } = req.body;

    const video =
      await Video.findById(id);

    if (
      !video ||
      video.isDeleted
    ) {
      return ApiResponse.notFound(
        res,
        'Video not found'
      );
    }

    if (title) {
      video.title = title;
    }

    if (description) {
      video.description =
        description;
    }

    if (
      isPublic !== undefined
    ) {
      video.isPublic =
        isPublic;
    }

    if (tags) {
      video.metadata.tags =
        tags;
    }

    await video.save();

    return ApiResponse.success(
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

    return ApiResponse.error(
      res,
      error,
      'Failed to update video'
    );
  }
};

/**
 * ---------------------------------------------------------
 * Delete video
 * ---------------------------------------------------------
 */
const deleteVideo = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const video =
      await Video.findById(id);

    if (
      !video ||
      video.isDeleted
    ) {
      return ApiResponse.notFound(
        res,
        'Video not found'
      );
    }

    video.isDeleted = true;

    await video.save();

    logger.info(
      `Video deleted: ${video.filename} by ${req.user.email}`
    );

    return ApiResponse.success(
      res,
      null,
      'Video deleted successfully'
    );
  } catch (error) {
    logger.error(
      'Delete video error:',
      error
    );

    return ApiResponse.error(
      res,
      error,
      'Failed to delete video'
    );
  }
};

/**
 * ---------------------------------------------------------
 * Get video statistics
 * ---------------------------------------------------------
 */
const getVideoStatistics = async (
  req,
  res
) => {
  try {
    const stats =
      await Video.getStatistics();

    const totalSize =
      await Video.aggregate([
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
        stats[0]?.total?.[0]
          ?.count || 0,

      totalSize:
        totalSize[0]?.total || 0,

      totalSizeMB:
        (
          (totalSize[0]?.total ||
            0) /
          (1024 * 1024)
        ).toFixed(2),

      byCamera:
        stats[0]?.byCamera || [],

      byStatus:
        stats[0]?.byStatus || [],

      recent:
        stats[0]?.recent || []
    };

    return ApiResponse.success(
      res,
      statistics,
      'Video statistics retrieved successfully'
    );
  } catch (error) {
    logger.error(
      'Get video statistics error:',
      error
    );

    return ApiResponse.error(
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