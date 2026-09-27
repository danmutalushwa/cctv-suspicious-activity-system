const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

const config = require('./config/env');
const logger = require('./utils/logger');

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const cameraRoutes = require('./routes/camera.routes');
const incidentRoutes = require('./routes/incident.routes');
const alertRoutes = require('./routes/alert.routes');
const videoRoutes = require('./routes/video.routes');
const aiRoutes = require('./routes/ai.routes');
const reportRoutes = require('./routes/report.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

// Utils
const ApiResponse = require('./utils/response');

const app = express();

/*
|--------------------------------------------------------------------------
| Security
|--------------------------------------------------------------------------
*/

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin',
    },
  })
);

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-API-Key',
    ],
  })
);

/*
|--------------------------------------------------------------------------
| Compression
|--------------------------------------------------------------------------
*/

app.use(compression());

/*
|--------------------------------------------------------------------------
| Body Parsers
|--------------------------------------------------------------------------
*/

app.use(
  express.json({
    limit: '10mb',
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

/*
|--------------------------------------------------------------------------
| HTTP Logger
|--------------------------------------------------------------------------
*/

if (config.nodeEnv !== 'test') {
  app.use(
    morgan('dev', {
      stream: {
        write: (message) => {
          logger.info(message.trim());
        },
      },
    })
  );
}

/*
|--------------------------------------------------------------------------
| Static Files
|--------------------------------------------------------------------------
|
| Files physically stored in:
|
| server/uploads/
|
| become accessible through:
|
| http://localhost:5000/uploads/...
|
*/

app.use(
  '/uploads',
  express.static(
    path.join(__dirname, '../uploads'),
    {
      setHeaders: (res) => {
        res.setHeader(
          'Access-Control-Allow-Origin',
          config.clientUrl
        );

        res.setHeader(
          'Access-Control-Allow-Credentials',
          'true'
        );

        res.setHeader(
          'Cross-Origin-Resource-Policy',
          'cross-origin'
        );
      },
    }
  )
);

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get('/api/health', async (req, res) => {
  try {
    return ApiResponse.success(
      res,
      {
        status: 'healthy',
        service: 'CCTV Suspicious Activity Detection API',
        environment: config.nodeEnv,
        timestamp: new Date().toISOString(),
      },
      'API is healthy'
    );
  } catch (error) {
    logger.error(
      'Health check error:',
      error
    );

    return ApiResponse.error(
      res,
      error,
      'Health check failed'
    );
  }
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use(
  '/api/auth',
  authRoutes
);

app.use(
  '/api/users',
  userRoutes
);

app.use(
  '/api/cameras',
  cameraRoutes
);

app.use(
  '/api/incidents',
  incidentRoutes
);

app.use(
  '/api/alerts',
  alertRoutes
);

app.use(
  '/api/videos',
  videoRoutes
);

app.use(
  '/api/ai',
  aiRoutes
);

app.use(
  '/api/reports',
  reportRoutes
);

app.use(
  '/api/dashboard',
  dashboardRoutes
);

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  return ApiResponse.notFound(
    res,
    `Route ${req.originalUrl} not found`
  );
});

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use((err, req, res, next) => {
  logger.error(
    'Unhandled application error:',
    err
  );

  if (res.headersSent) {
    return next(err);
  }

  return ApiResponse.error(
    res,
    err,
    'Internal server error'
  );
});

module.exports = app;