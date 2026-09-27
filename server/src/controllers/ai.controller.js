const AIService = require('../services/ai.service');
const Incident = require('../models/Incident');
const Camera = require('../models/Camera');
const Alert = require('../models/Alert');
const ActivityLog = require('../models/ActivityLog');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Analyze an uploaded image (raw AI result)
 */
const analyzeImage = async (req, res) => {
  try {
    if (!req.file) return ApiResponse.badRequest(res, 'No image provided');

    const result = await AIService.detectSuspiciousActivity(req.file.path);
    ApiResponse.success(res, result, 'Analysis complete');
  } catch (error) {
    logger.error('Analyze image error:', error);
    ApiResponse.error(res, error, 'Failed to analyze image');
  }
};

/**
 * Analyze image AND create an incident + alert if suspicious
 */
const analyzeAndReport = async (req, res) => {
  try {
    if (!req.file) return ApiResponse.badRequest(res, 'No image provided');

    const { cameraId } = req.body;

    // 1. Run AI detection
    const aiResult = await AIService.detectSuspiciousActivity(req.file.path);

    if (!aiResult.success) {
      return ApiResponse.error(
        res,
        new Error('AI service failed'),
        'AI detection failed'
      );
    }

    // 2. If not suspicious, return early
    if (!aiResult.is_suspicious || aiResult.count === 0) {
      return ApiResponse.success(
        res,
        { ai: aiResult, incident: null, alert: null },
        'No suspicious activity detected'
      );
    }

    // 3. Look up camera (optional)
    let camera = null;
    if (cameraId) camera = await Camera.findById(cameraId);

    // 4. Create incident
    const primaryActivity = aiResult.suspicious_activities[0];
    const incident = await Incident.create({
      title: `${primaryActivity.activities.join(', ')} detected`,
      description: `AI detected ${primaryActivity.activities.join(
        ', '
      )} with severity ${primaryActivity.severity}.`,
      type: mapActivityToIncidentType(primaryActivity.activities[0]),
      severity: aiResult.overall_severity || 'medium',
      status: 'pending',
      reportedBy: req.userId,
      confidence: primaryActivity.confidence,
      boundingBox: primaryActivity.bbox
        ? {
            x: primaryActivity.bbox[0],
            y: primaryActivity.bbox[1],
            width: primaryActivity.bbox[2] - primaryActivity.bbox[0],
            height: primaryActivity.bbox[3] - primaryActivity.bbox[1],
          }
        : undefined,
      location: {
        cameraId: camera?._id,
        address: camera?.location || 'Unknown',
      },
      detectedAt: new Date(),
      aiAnalysis: {
        predictedType: primaryActivity.activities[0],
        confidence: primaryActivity.confidence,
        features: primaryActivity,
        processedAt: new Date(),
        modelVersion: 'yolov8n',
      },
    });

    // 5. Create alert
    const alert = await Alert.create({
      title: `[AI] ${incident.title}`,
      message: `AI detected suspicious activity: ${primaryActivity.activities.join(
        ', '
      )}`,
      priority: mapSeverityToPriority(aiResult.overall_severity),
      type: 'in_app',
      incidentId: incident._id,
      cameraId: camera?._id,
      recipients: [{ userId: req.userId, status: 'pending' }],
      channels: ['in_app', 'socket'],
      metadata: {
        location: camera?.location,
        severity: aiResult.overall_severity,
        cameraName: camera?.name,
        timestamp: new Date(),
      },
    });

    // 6. Log activity
    try {
      await ActivityLog.create({
        user: req.userId,
        action: 'AI_DETECTION',
        resource: 'Incident',
        resourceId: incident._id,
        details: { activities: primaryActivity.activities },
      });
    } catch (logError) {
      logger.warn('Activity log failed:', logError.message);
    }

    // 7. Emit socket events
    const io = req.app.get('io');
    if (io) {
      io.emit('new_alert', {
        alert: alert.toObject(),
        timestamp: new Date().toISOString(),
      });
      io.emit('incident_created', {
        incident: incident.toObject(),
        timestamp: new Date().toISOString(),
      });
    }

    logger.info(
      `AI created incident ${incident.incidentNumber} and alert ${alert._id}`
    );

    ApiResponse.success(
      res,
      { ai: aiResult, incident, alert },
      'Suspicious activity detected and reported'
    );
  } catch (error) {
    logger.error('Analyze and report error:', error);
    ApiResponse.error(res, error, 'Failed to analyze and report');
  }
};

/**
 * Check AI service health
 */
const checkHealth = async (req, res) => {
  const healthy = await AIService.healthCheck();
  ApiResponse.success(
    res,
    { healthy },
    healthy ? 'AI service is healthy' : 'AI service is down'
  );
};

/**
 * Get AI model info
 */
const getModelInfo = async (req, res) => {
  try {
    const info = await AIService.getModelInfo();
    ApiResponse.success(res, info, 'AI model info retrieved');
  } catch (error) {
    logger.error('Get model info error:', error);
    ApiResponse.error(res, error, 'Failed to get model info');
  }
};

// ---------- Helpers ----------

const mapActivityToIncidentType = (activity) => {
  const map = {
    loitering: 'loitering',
    intrusion: 'intrusion',
    trespassing: 'trespassing',
    rapid_movement: 'suspicious_behavior',
    unusual_behavior: 'suspicious_behavior',
  };
  return map[activity] || 'suspicious_behavior';
};

const mapSeverityToPriority = (severity) => {
  const map = {
    low: 'low',
    medium: 'medium',
    high: 'high',
    critical: 'critical',
  };
  return map[severity] || 'medium';
};

module.exports = {
  analyzeImage,
  analyzeAndReport,
  checkHealth,
  getModelInfo,
};