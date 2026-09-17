module.exports = {
  // User Roles
  USER_ROLES: {
    ADMIN: 'admin',
    OPERATOR: 'operator',
    VIEWER: 'viewer'
  },

  // Incident Status
  INCIDENT_STATUS: {
    PENDING: 'pending',
    UNDER_REVIEW: 'under_review',
    CONFIRMED: 'confirmed',
    FALSE_ALARM: 'false_alarm',
    RESOLVED: 'resolved'
  },

  // Incident Types
  INCIDENT_TYPES: {
    INTRUSION: 'intrusion',
    LOITERING: 'loitering',
    TRESPASSING: 'trespassing',
    VIOLENCE: 'violence',
    ABANDONED_OBJECT: 'abandoned_object',
    THEFT: 'theft',
    VANDALISM: 'vandalism',
    SUSPICIOUS_BEHAVIOR: 'suspicious_behavior',
    OTHER: 'other'
  },

  // Alert Types
  ALERT_TYPES: {
    EMAIL: 'email',
    SMS: 'sms',
    IN_APP: 'in_app',
    PUSH: 'push',
    SOCKET: 'socket'
  },

  // Alert Priority
  ALERT_PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  },

  // Camera Status
  CAMERA_STATUS: {
    ONLINE: 'online',
    OFFLINE: 'offline',
    RECORDING: 'recording',
    ERROR: 'error'
  },

  // Evidence Types
  EVIDENCE_TYPES: {
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio',
    DOCUMENT: 'document'
  },

  // Severity Levels for Incidents
  SEVERITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  },

  // Response Messages
  RESPONSE_MESSAGES: {
    SUCCESS: 'Success',
    ERROR: 'Error',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Forbidden',
    NOT_FOUND: 'Resource not found',
    VALIDATION_ERROR: 'Validation error',
    DUPLICATE: 'Duplicate entry',
    SERVER_ERROR: 'Internal server error'
  },

  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
  }
};