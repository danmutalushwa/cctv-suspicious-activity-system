const http = require('http');
const mongoose = require('mongoose');
const socketIO = require('socket.io');

const app = require('./app');
const config = require('./config/env');
const logger = require('./utils/logger');
const connectDB = require('./config/database');
const setupSocketIO = require('./sockets/alert.socket');
const MonitoringService = require('./services/monitoring.service');

const PORT = config.port;

// ==========================================
// CREATE HTTP SERVER
// ==========================================
const server = http.createServer(app);

// ==========================================
// SETUP SOCKET.IO
// ==========================================
const io = socketIO(server, {
  cors: {
    origin: config.clientUrl || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Setup Socket.IO event handlers
setupSocketIO(io);

// Make Socket.IO accessible from Express controllers
app.set('io', io);

// ==========================================
// INITIALIZE MONITORING SERVICE
// ==========================================
const monitoringService = new MonitoringService(io);

monitoringService.start();

app.set('monitoringService', monitoringService);

// ==========================================
// REQUEST TRACKING MIDDLEWARE
// ==========================================
app.use((req, res, next) => {
  const start = Date.now();

  const originalJson = res.json;

  res.json = function (data) {
    const responseTime = Date.now() - start;

    const hasError =
      !data.success && data.success !== undefined;

    monitoringService.trackRequest(
      responseTime,
      hasError
    );

    return originalJson.call(this, data);
  };

  next();
});

// ==========================================
// SOCKET CONNECTION TRACKING
// ==========================================
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  monitoringService.trackConnection(1);

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);

    monitoringService.trackConnection(-1);
  });
});

// ==========================================
// CONNECT TO MONGODB
// ==========================================
connectDB();

// ==========================================
// START SERVER
// ==========================================
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`API URL: http://localhost:${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/api/health`);
  logger.info(`Socket.IO running on port ${PORT}`);
  logger.info(`Monitoring service initialized`);
});

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================
const shutdown = () => {
  logger.info('Shutting down server gracefully...');

  // Stop monitoring service
  monitoringService.stop();

  // Close Socket.IO
  io.close(() => {
    logger.info('Socket.IO closed');

    // Close MongoDB connection
    mongoose.connection.close(() => {
      logger.info('MongoDB connection closed');

      // Close HTTP server
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });
  });
};

// ==========================================
// HANDLE TERMINATION SIGNALS
// ==========================================
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ==========================================
// HANDLE UNHANDLED PROMISE REJECTIONS
// ==========================================
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  shutdown();
});

// ==========================================
// HANDLE UNCAUGHT EXCEPTIONS
// ==========================================
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  shutdown();
});