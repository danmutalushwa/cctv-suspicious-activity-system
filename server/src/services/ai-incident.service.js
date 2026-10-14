const Incident = require('../models/Incident');
const Alert = require('../models/Alert');

const logger = require('../utils/logger');

const {
  INCIDENT_TYPES,
  INCIDENT_STATUS,
  SEVERITY
} = require('../config/constants');


// ============================================================
// MAP INCIDENT TYPE
// ============================================================

const normalizeIncidentType = (activity) => {
  const activityMap = {
    intrusion:
      INCIDENT_TYPES.INTRUSION,

    loitering:
      INCIDENT_TYPES.LOITERING,

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


// ============================================================
// MAP SEVERITY
// ============================================================

const normalizeSeverity = (severity) => {
  const validSeverities = [
    SEVERITY.LOW,
    SEVERITY.MEDIUM,
    SEVERITY.HIGH,
    SEVERITY.CRITICAL
  ];

  if (
    validSeverities.includes(severity)
  ) {
    return severity;
  }

  return SEVERITY.LOW;
};


// ============================================================
// CREATE INCIDENT + ALERT
// ============================================================

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

    const activities =
      Array.isArray(
        detection.activities
      )
        ? detection.activities
        : [];

    if (
      activities.length === 0
    ) {
      logger.warn(
        'AI detection contains no activities'
      );

      return null;
    }

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
      Number(
        detection.confidence
      ) || 0;

    const reason =
      detection.reason ||
      `AI detected ${primaryActivity.replace(
        /_/g,
        ' '
      )}`;

    // ========================================================
    // CREATE INCIDENT
    // ========================================================

    const incident =
      await Incident.create({
        title:
          `AI Detected ${primaryActivity.replace(
            /_/g,
            ' '
          )}`,

        description:
          `Suspicious activity detected automatically by the AI system. Reason: ${reason}. Video: "${video.originalName}".`,

        type:
          incidentType,

        status:
          INCIDENT_STATUS.PENDING,

        severity,

        reportedBy:
          video.uploadedBy,

        cameraId:
          video.cameraId ||
          undefined,

        detectedAt:
          new Date(),

        confidence,

        boundingBox:
          Array.isArray(
            detection.bbox
          ) &&
          detection.bbox.length >= 4
            ? {
                x:
                  Number(
                    detection.bbox[0]
                  ) || 0,

                y:
                  Number(
                    detection.bbox[1]
                  ) || 0,

                width:
                  (
                    Number(
                      detection.bbox[2]
                    ) || 0
                  ) -
                  (
                    Number(
                      detection.bbox[0]
                    ) || 0
                  ),

                height:
                  (
                    Number(
                      detection.bbox[3]
                    ) || 0
                  ) -
                  (
                    Number(
                      detection.bbox[1]
                    ) || 0
                  )
              }
            : undefined,

        aiAnalysis: {
          predictedType:
            incidentType,

          confidence,

          features: {
            activities,

            reason,

            zone:
              detection.zone ||
              null,

            frame:
              frame ||
              null,

            trackId:
              detection.track_id ??
              null
          },

          modelVersion:
            'YOLOv8 + DeepSORT',

          processedAt:
            new Date()
        },

        metadata: {
          source:
            'ai',

          videoId:
            video._id,

          frame:
            frame ||
            null,

          reason
        }
      });

    // ========================================================
    // LINK INCIDENT TO VIDEO
    // ========================================================

    if (!video.incidentId) {
      video.incidentId =
        incident._id;

      await video.save();
    }

    // ========================================================
    // CREATE ALERT
    // ========================================================

    const alert =
      await Alert.create({
        title:
          `[AI] ${incident.title}`,

        message:
          `${reason}. Severity: ${severity}.`,

        priority:
          severity,

        type:
          'in_app',

        incidentId:
          incident._id,

        cameraId:
          video.cameraId ||
          undefined,

        recipients:
          video.uploadedBy
            ? [
                {
                  userId:
                    video.uploadedBy,

                  status:
                    'pending'
                }
              ]
            : [],

        channels: [
          'in_app',
          'socket'
        ],

        metadata: {
          source:
            'ai',

          videoId:
            video._id,

          severity,

          activities,

          reason,

          frame:
            frame ||
            null,

          timestamp:
            new Date()
        }
      });

    // ========================================================
    // LOG
    // ========================================================

    logger.info(
      `AI incident created: ${incident.incidentNumber}`
    );

    logger.info(
      `AI alert created: ${alert._id}`
    );

    logger.info(
      `AI reason: ${reason}`
    );

    // ========================================================
    // RETURN BOTH
    // ========================================================

    return {
      incident,
      alert
    };

  } catch (error) {
    logger.error(
      `Failed to create AI incident: ${error.message}`
    );

    throw error;
  }
};


// ============================================================
// PROCESS AI RESULTS
// ============================================================

const processAIResults = async ({
  aiResults,
  video
}) => {
  const results = [];

  if (
    !Array.isArray(aiResults)
  ) {
    logger.warn(
      'AI results are not an array'
    );

    return results;
  }

  if (!video) {
    logger.warn(
      'No video provided for AI incident processing'
    );

    return results;
  }

  /**
   * ----------------------------------------------------------
   * Prevent duplicate incidents
   * ----------------------------------------------------------
   *
   * A suspicious person can appear in many consecutive
   * frames. We do not want 100 identical incidents for
   * the same track/activity.
   *
   * Key:
   * activity + track ID + video
   */
  const processedDetections =
    new Set();

  for (
    const result of aiResults
  ) {
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

      /**
       * IMPORTANT:
       *
       * aiService.analyzeFrames()
       * adds framePath to every result.
       *
       * Therefore we use:
       *
       * result.framePath
       *
       * rather than result.frame.
       */
      const frame =
        result.framePath ||
        result.frame ||
        null;

      for (
        const detection
        of suspiciousActivities
      ) {
        const activities =
          Array.isArray(
            detection.activities
          )
            ? detection.activities
            : [];

        if (
          activities.length === 0
        ) {
          continue;
        }

        const trackId =
          detection.track_id ??
          'unknown';

        /**
         * Create a key for the same activity
         * being detected on the same tracked
         * person in this video.
         */
        const detectionKey =
          `${video._id}:` +
          `${trackId}:` +
          `${activities.sort().join(',')}`;

        if (
          processedDetections.has(
            detectionKey
          )
        ) {
          logger.info(
            `Skipping duplicate AI detection: ${detectionKey}`
          );

          continue;
        }

        processedDetections.add(
          detectionKey
        );

        // ----------------------------------------------------
        // Create Incident + Alert
        // ----------------------------------------------------

        const created =
          await createIncidentFromDetection({
            detection,

            video,

            frame
          });

        if (created) {
          results.push(
            created
          );
        }
      }

    } catch (error) {
      logger.error(
        `Failed to process AI result for frame ${
          result?.framePath ||
          result?.frame ||
          'unknown'
        }: ${error.message}`
      );
    }
  }

  logger.info(
    `AI incident processing completed: ${results.length} incident/alert pair(s) created`
  );

  return results;
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  normalizeIncidentType,
  normalizeSeverity,
  createIncidentFromDetection,
  processAIResults
};