export const ROUTES = {
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Dashboard
  DASHBOARD: '/dashboard',
  REAL_TIME: '/dashboard/realtime',
  TIMELINE: '/dashboard/timeline',
  SYSTEM_HEALTH: '/dashboard/health',
  AI_TEST: '/dashboard/ai-test',

  // Incidents
  INCIDENTS: '/incidents',
  INCIDENT_DETAILS: '/incidents/:id',
  CREATE_INCIDENT: '/incidents/create',
  EDIT_INCIDENT: '/incidents/:id/edit',

  // Alerts
  ALERTS: '/alerts',
  ALERT_DETAILS: '/alerts/:id',

  // Videos
  VIDEOS: '/videos',
  VIDEO_DETAILS: '/videos/:id',

  // Cameras
  CAMERAS: '/cameras',
  CAMERA_DETAILS: '/cameras/:id',
  ADD_CAMERA: '/cameras/add',

  // Reports
  REPORTS: '/reports',
  REPORT_DETAILS: '/reports/:id',
  GENERATE_REPORT: '/reports/generate',

  // Users
  USERS: '/users',
  USER_DETAILS: '/users/:id',
  ADD_USER: '/users/add',

  // Profile
  PROFILE: '/profile',
  SETTINGS: '/settings',

  // Errors
  NOT_FOUND: '*',
};

// Helper functions for parameterized routes
export const buildRoute = {
  incidentDetails: (id) => `/incidents/${id}`,
  editIncident: (id) => `/incidents/${id}/edit`,
  alertDetails: (id) => `/alerts/${id}`,
  videoDetails: (id) => `/videos/${id}`,
  cameraDetails: (id) => `/cameras/${id}`,
  reportDetails: (id) => `/reports/${id}`,
  userDetails: (id) => `/users/${id}`,
};