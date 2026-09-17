const logger = require('../utils/logger');
const Incident = require('../models/Incident');
const Alert = require('../models/Alert');
const os = require('os');

class MonitoringService {
  constructor(io) {
    this.io = io;
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      responseTimes: [],
      activeConnections: 0
    };
    this.startTime = Date.now();
    this.isRunning = false;
    this.interval = null;
  }

  /**
   * Start monitoring
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.interval = setInterval(() => {
      this.collectMetrics();
    }, 60000); // Every minute

    logger.info('Monitoring service started');
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    logger.info('Monitoring service stopped');
  }

  /**
   * Collect system metrics
   */
  async collectMetrics() {
    try {
      const now = new Date();
      const lastHour = new Date(now);
      lastHour.setHours(lastHour.getHours() - 1);

      // Get system metrics
      const metrics = {
        timestamp: now.toISOString(),
        system: {
          cpu: os.loadavg()[0],
          memory: {
            total: os.totalmem(),
            free: os.freemem(),
            used: os.totalmem() - os.freemem(),
            usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
          },
          uptime: process.uptime(),
          platform: os.platform(),
          hostname: os.hostname()
        },
        application: {
          requestCount: this.metrics.requestCount,
          errorCount: this.metrics.errorCount,
          errorRate: this.metrics.requestCount > 0 
            ? (this.metrics.errorCount / this.metrics.requestCount * 100).toFixed(2)
            : 0,
          avgResponseTime: this.metrics.responseTimes.length > 0
            ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length
            : 0,
          activeConnections: this.metrics.activeConnections,
          uptime: process.uptime()
        },
        data: {
          incidentsLastHour: await Incident.countDocuments({
            isDeleted: false,
            detectedAt: { $gte: lastHour }
          }),
          alertsLastHour: await Alert.countDocuments({
            isDeleted: false,
            createdAt: { $gte: lastHour }
          }),
          criticalAlerts: await Alert.countDocuments({
            isDeleted: false,
            priority: 'critical',
            'recipients.status': { $ne: 'read' }
          })
        }
      };

      // Broadcast metrics to admin clients
      this.io.sendToRole('admin', 'system_metrics', metrics);

      // Reset counters
      this.metrics.requestCount = 0;
      this.metrics.errorCount = 0;
      this.metrics.responseTimes = [];

    } catch (error) {
      logger.error('Collect metrics error:', error);
    }
  }

  /**
   * Track request
   */
  trackRequest(responseTime, hasError = false) {
    this.metrics.requestCount += 1;
    if (hasError) {
      this.metrics.errorCount += 1;
    }
    this.metrics.responseTimes.push(responseTime);
  }

  /**
   * Track connection
   */
  trackConnection(delta) {
    this.metrics.activeConnections += delta;
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics() {
    return {
      ...this.metrics,
      startTime: this.startTime,
      uptime: process.uptime()
    };
  }

  /**
   * Check system health
   */
  checkHealth() {
    const issues = [];
    const warnings = [];

    // Check memory usage
    const memoryUsage = (os.totalmem() - os.freemem()) / os.totalmem() * 100;
    if (memoryUsage > 90) {
      issues.push('Memory usage exceeds 90%');
    } else if (memoryUsage > 75) {
      warnings.push('Memory usage exceeds 75%');
    }

    // Check CPU load
    const cpuLoad = os.loadavg()[0];
    const cpuCores = os.cpus().length;
    if (cpuLoad > cpuCores * 0.8) {
      issues.push('CPU load is very high');
    } else if (cpuLoad > cpuCores * 0.6) {
      warnings.push('CPU load is elevated');
    }

    // Check error rate
    const errorRate = this.metrics.requestCount > 0 
      ? (this.metrics.errorCount / this.metrics.requestCount * 100)
      : 0;
    if (errorRate > 5) {
      issues.push(`Error rate ${errorRate.toFixed(2)}% exceeds 5%`);
    } else if (errorRate > 2) {
      warnings.push(`Error rate ${errorRate.toFixed(2)}% exceeds 2%`);
    }

    return {
      status: issues.length === 0 ? 'healthy' : 'degraded',
      issues,
      warnings,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = MonitoringService;