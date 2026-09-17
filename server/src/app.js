const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

const config = require('./config/env');
const logger = require('./utils/logger');
const ApiResponse = require('./utils/response');
const { HTTP_STATUS } = require('./config/constants');

const authRoutes = require('./routes/auth.routes');
const incidentRoutes = require('./routes/incident.routes');
const alertRoutes = require('./routes/alert.routes');
const testRoutes = require('./routes/test.routes');
const videoRoutes = require('./routes/video.routes');
const reportRoutes = require('./routes/report.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const userRoutes = require('./routes/user.routes'); 
const cameraRoutes = require('./routes/camera.routes');

const app = express();

// Middleware
app.use(helmet());
app.use(compression());

app.use(cors({
  origin: config.clientUrl,
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  ApiResponse.success(res, {
    status: 'OK',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  }, 'Server is healthy');
});

// Welcome route
app.get('/', (req, res) => {
  ApiResponse.success(res, {
    name: 'Intelligent CCTV Suspicious Activity Detection System API',
    version: '1.0.0',
    environment: config.nodeEnv,
    endpoints: {
      health: '/api/health',
      test: '/api/test',
      auth: '/api/auth'
    },
    documentation: '/api/docs'
  }, 'Welcome to the API');
});

// Test route
app.get('/api/test', (req, res) => {
  ApiResponse.success(res, {
    message: 'API is working!',
    timestamp: new Date().toISOString()
  }, 'Test successful');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/test', testRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes); 
app.use('/api/cameras', cameraRoutes);

// 404 handler
app.use((req, res) => {
  ApiResponse.notFound(res, `Route ${req.originalUrl} not found`);
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Global error handler:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    error: config.nodeEnv === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
});

module.exports = app;