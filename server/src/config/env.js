const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnv = [
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'NODE_ENV'
];

requiredEnv.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Environment variable ${envVar} is required`);
  }
});

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760,
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15,
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:5001',
  aiDetectionEndpoint: process.env.AI_DETECTION_ENDPOINT || '/api/v1/detect',
  aiTrackingEndpoint: process.env.AI_TRACKING_ENDPOINT || '/api/v1/track',
  smtp: {
    // Falls back to a clean string if SMTP_HOST is missing or corrupted
    host: (process.env.EMAIL_HOST || process.env.SMTP_HOST || '://gmail.com').replace(/^https?:\/\//, ''),
    port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT, 10) || 587,
    user: process.env.EMAIL_USER || process.env.SMTP_USER,
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS
  },

  log: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs'
  }
};