const Incident = require('../models/Incident');
const logger = require('../utils/logger');
const {
  INCIDENT_TYPES,
  INCIDENT_STATUS,
  SEVERITY
} = require('../config/constants');

/**
 * Convert AI activity names to valid Incident types.
 *
 * The AI currently detects:
 * - intrusion
 * - loitering
 * - rapid_movement
 * - unusual_behavior
 *
 * We only map activities that are currently supported
 * by the Python AI service.
 */
const normalizeIncidentType = (activity) => {
  const activityMap = {
    intrusion: INCIDENT_TYPES.INTRUSION,
    loitering: INCIDENT_TYPES.LOITERING,

    rapid_movement:
      INCIDENT_TYPES.SUSPICIOUS_BEHAVIOR,

    unusual_behavior:
      INCIDENT_TYPES.SUSPICIOUS_BEHAVIOR
  };

  return (
    activityMap[activity] ||
    INCIDENT_TYPES.SUSPICIOUS_BEHAVIOR
  );
};

/**
 * Normalize AI severity to the Incident severity enum.
 */
const normalizeSeverity = (severity) => {
  const validSeverities = [
    SEVERITY.LOW,
    SEVERITY.MEDIUM,
    SEVERITY.HIGH,
    SEVERITY.CRITICAL
  ];

  if (validSeverities.includes(severity)) {
    return severity;
  }

  return SEVERITY.LOW;
};

/**
 * Create an Incident from one suspicious AI detection.
 */
const createIncidentFromDetection = async ({
  detection,
  video,
  frame
}) => {
  try {
    if (!detection) {
      throw new Error(
        'No AI detection provided'
      );
    }

    if (!video) {
      throw new Error(
        'No video provided'
      );
    }

    /*
     * The AI activity object normally contains:
     *
     * {
     *   activities: ['intrusion'],
     *   severity: 'high',
     *   zone: 'zone_1',
     *   confidence: 0.87
     * }
     */

    const activities =
      Array.isArray(detection.activities)
        ? detection.activities
        : [];

    if (activities.length === 0) {
      logger.warn(
        'AI detection contains no activities'
      );

      return null;
    }

    // Use the first detected activity as the
    // primary incident type.
    const primaryActivity =
      activities[0];

    const incidentType =
      normalizeIncidentType(
        primaryActivity
      );

    const severity =
      normalizeSeverity(
        detection.severity
      );

    const confidence =
      Number(detection.confidence) || 0;

    /*
     * Create the incident.
     */
    const incident = await Incident.create({
      title: `AI Detected ${primaryActivity.replace(
        /_/g,
        ' '
      )}`,

      description:
        `Suspicious activity detected automatically by the AI system in video "${video.originalName}".`,

      type: incidentType,

      status:
        INCIDENT_STATUS.PENDING,

      severity,

      reportedBy:
        video.uploadedBy,

      cameraId:
        video.cameraId || undefined,

      detectedAt:
        new Date(),

      confidence,

      boundingBox:
        detection.bbox
          ? {
              x: detection.bbox[0] || 0,
              y: detection.bbox[1] || 0,
              width:
                (detection.bbox[2] || 0) -
                (detection.bbox[0] || 0),
              height:
                (detection.bbox[3] || 0) -
                (detection.bbox[1] || 0)
            }
          : undefined,

      aiAnalysis: {
        predictedType:
          incidentType,

        confidence,

        features: {
          activities,
          zone:
            detection.zone || null,

          frame:
            frame || null,

          trackId:
            detection.track_id || null
        },

        modelVersion:
          'YOLOv8 + DeepSORT',

        processedAt:
          new Date()
      },

      metadata: {
        source: 'ai',
        videoId: video._id,
        frame: frame || null
      }
    });

    /*
     * Link the incident back to the video.
     */
    if (!video.incidentId) {
      video.incidentId = incident._id;
      await video.save();
    }

    logger.info(
      `AI incident created: ${incident.incidentNumber} | ${incidentType} | ${severity}`
    );

    return incident;
  } catch (error) {
    logger.error(
      `Failed to create AI incident: ${error.message}`
    );

    throw error;
  }
};

/**
 * Process all suspicious AI results for a video.
 */
const processAIResults = async ({
  aiResults,
  video
}) => {
  const incidents = [];

  if (!Array.isArray(aiResults)) {
    logger.warn(
      'AI results are not an array'
    );

    return incidents;
  }

  for (const result of aiResults) {
    try {
      if (
        !result ||
        !result.success ||
        !result.is_suspicious
      ) {
        continue;
      }

      const suspiciousActivities =
        Array.isArray(
          result.suspicious_activities
        )
          ? result.suspicious_activities
          : [];

      /*
       * Each frame can contain multiple
       * suspicious detections.
       */
      for (
        const detection of suspiciousActivities
      ) {
        const incident =
          await createIncidentFromDetection({
            detection,
            video,
            frame: result.frame
          });

        if (incident) {
          incidents.push(incident);
        }
      }
    } catch (error) {
      logger.error(
        `Failed to process AI result for frame ${
          result.frame || 'unknown'
        }: ${error.message}`
      );
    }
  }

  logger.info(
    `AI incident processing completed: ${incidents.length} incidents created`
  );

  return incidents;
};

module.exports = {
  normalizeIncidentType,
  normalizeSeverity,
  createIncidentFromDetection,
  processAIResults
};