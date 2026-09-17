const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const logger = require('../utils/logger');
const config = require('../config/env');

const unlinkAsync = promisify(fs.unlink);

/**
 * Extract video metadata using ffmpeg
 * @param {string} filePath - Path to video file
 * @returns {Promise<Object>} Video metadata
 */
const extractVideoMetadata = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

      const result = {
        duration: metadata.format.duration || 0,
        bitrate: metadata.format.bit_rate ? parseInt(metadata.format.bit_rate) : 0,
        size: metadata.format.size ? parseInt(metadata.format.size) : 0,
        format: metadata.format.format_name,
        video: videoStream ? {
          codec: videoStream.codec_name,
          width: videoStream.width,
          height: videoStream.height,
          framerate: eval(videoStream.avg_frame_rate || '0'),
          bitrate: videoStream.bit_rate ? parseInt(videoStream.bit_rate) : 0,
          pixelFormat: videoStream.pix_fmt,
          profile: videoStream.profile
        } : null,
        audio: audioStream ? {
          codec: audioStream.codec_name,
          channels: audioStream.channels,
          sampleRate: audioStream.sample_rate,
          bitrate: audioStream.bit_rate ? parseInt(audioStream.bit_rate) : 0
        } : null
      };

      resolve(result);
    });
  });
};

/**
 * Generate thumbnail from video
 * @param {string} filePath - Path to video file
 * @param {string} outputPath - Path to save thumbnail
 * @param {Object} options - Thumbnail options
 * @returns {Promise<string>} Path to generated thumbnail
 */
const generateThumbnail = (filePath, outputPath, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      size = '320x240',
      timestamp = '00:00:01',
      filename = 'thumbnail.jpg'
    } = options;

    const fullOutputPath = path.join(outputPath, filename);

    ffmpeg(filePath)
      .screenshots({
        timestamps: [timestamp],
        filename: filename,
        folder: outputPath,
        size: size
      })
      .on('end', () => {
        resolve(fullOutputPath);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};

/**
 * Generate multiple thumbnails from video
 * @param {string} filePath - Path to video file
 * @param {string} outputPath - Path to save thumbnails
 * @param {Array} timestamps - Array of timestamps
 * @returns {Promise<Array>} Array of thumbnail paths
 */
const generateMultipleThumbnails = async (filePath, outputPath, timestamps = []) => {
  return new Promise((resolve, reject) => {
    const thumbnails = [];

    ffmpeg(filePath)
      .screenshots({
        timestamps: timestamps,
        filename: 'thumbnail-%s.jpg',
        folder: outputPath,
        size: '320x240'
      })
      .on('end', () => {
        // Generate paths for all thumbnails
        timestamps.forEach((timestamp, index) => {
          const filename = `thumbnail-${index}.jpg`;
          thumbnails.push(path.join(outputPath, filename));
        });
        resolve(thumbnails);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};

/**
 * Compress video
 * @param {string} inputPath - Input video path
 * @param {string} outputPath - Output video path
 * @param {Object} options - Compression options
 * @returns {Promise<string>} Path to compressed video
 */
const compressVideo = (inputPath, outputPath, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      videoBitrate = '1000k',
      audioBitrate = '128k',
      size = '720x480',
      codec = 'libx264'
    } = options;

    ffmpeg(inputPath)
      .videoCodec(codec)
      .videoBitrate(videoBitrate)
      .audioCodec('aac')
      .audioBitrate(audioBitrate)
      .size(size)
      .aspect('16:9')
      .output(outputPath)
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        reject(err);
      })
      .run();
  });
};

/**
 * Get video duration
 * @param {string} filePath - Path to video file
 * @returns {Promise<number>} Duration in seconds
 */
const getVideoDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(metadata.format.duration || 0);
    });
  });
};

/**
 * Validate video file
 * @param {string} filePath - Path to video file
 * @returns {Promise<Object>} Validation result
 */
const validateVideo = async (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    const metadata = await extractVideoMetadata(filePath);

    // Check minimum requirements
    const isValid = {
      hasVideo: !!metadata.video,
      hasAudio: !!metadata.audio,
      duration: metadata.duration > 0,
      width: metadata.video?.width > 0,
      height: metadata.video?.height > 0,
      fileSize: stats.size > 0
    };

    const allValid = Object.values(isValid).every(v => v === true);

    return {
      valid: allValid,
      metadata,
      stats,
      checks: isValid,
      errors: Object.keys(isValid)
        .filter(key => !isValid[key])
        .map(key => `${key} validation failed`)
    };
  } catch (error) {
    logger.error('Video validation error:', error);
    return {
      valid: false,
      error: error.message
    };
  }
};

/**
 * Delete video file
 * @param {string} filePath - Path to video file
 * @returns {Promise<void>}
 */
const deleteVideoFile = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      await unlinkAsync(filePath);
      logger.info(`Deleted video file: ${filePath}`);
    }
  } catch (error) {
    logger.error(`Failed to delete video file ${filePath}:`, error);
    throw error;
  }
};

/**
 * Get video stats
 * @param {string} filePath - Path to video file
 * @returns {Promise<Object>} Video statistics
 */
const getVideoStats = async (filePath) => {
  const stats = fs.statSync(filePath);
  const metadata = await extractVideoMetadata(filePath);

  return {
    size: stats.size,
    createdAt: stats.birthtime,
    modifiedAt: stats.mtime,
    duration: metadata.duration,
    bitrate: metadata.bitrate,
    resolution: metadata.video ? {
      width: metadata.video.width,
      height: metadata.video.height
    } : null,
    codec: metadata.video?.codec,
    framerate: metadata.video?.framerate
  };
};

/**
 * Extract frames from a video for AI analysis
 * @param {string} filePath - Path to the video
 * @param {string} outputDir - Directory where frames will be stored
 * @param {object} options - Extraction options
 * @returns {Promise<string[]>} Array of extracted frame paths
 */
const extractFramesForAI = (filePath, outputDir, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      interval = 2,
      maxFrames = 300,
      imageSize = '640x360'
    } = options;

    const fs = require('fs');
    const path = require('path');
    const ffmpeg = require('fluent-ffmpeg');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const framePattern = path.join(outputDir, 'frame-%06d.jpg');

    logger.info(
      `Starting AI frame extraction: interval=${interval}s, maxFrames=${maxFrames}`
    );

    ffmpeg(filePath)
      .outputOptions([
        `-vf fps=1/${interval},scale=${imageSize}`,
        `-frames:v ${maxFrames}`,
        '-q:v 3'
      ])
      .output(framePattern)
      .on('start', commandLine => {
        logger.info(`FFmpeg AI extraction started: ${commandLine}`);
      })
      .on('end', () => {
        try {
          const frames = fs.readdirSync(outputDir)
            .filter(file => file.toLowerCase().endsWith('.jpg'))
            .sort()
            .map(file => path.join(outputDir, file));

          logger.info(`AI frame extraction completed: ${frames.length} frames`);

          resolve(frames);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', error => {
        logger.error(`AI frame extraction failed: ${error.message}`);
        reject(error);
      })
      .run();
  });
};

module.exports = {
  extractVideoMetadata,
  generateThumbnail,
  generateMultipleThumbnails,
  extractFramesForAI,
  compressVideo,
  getVideoDuration,
  validateVideo,
  deleteVideoFile,
  getVideoStats
};