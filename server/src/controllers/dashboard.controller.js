const Incident = require('../models/Incident');
const Alert = require('../models/Alert');
const Video = require('../models/Video');
const User = require('../models/User');
const Camera = require('../models/Camera'); // We'll create this later
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Get dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;

    // Get current date and date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    // Base filter for incidents
    const baseFilter = { isDeleted: false };
    
    // If not admin, only show incidents from their cameras or assigned to them
    if (userRole !== 'admin') {
      // This will be expanded when we add camera assignments
      baseFilter.$or = [
        { reportedBy: userId },
        { assignedTo: userId }
      ];
    }

    // Get statistics in parallel
    const [
      totalIncidents,
      todayIncidents,
      weekIncidents,
      monthIncidents,
      byStatus,
      bySeverity,
      byType,
      criticalAlerts,
      totalVideos,
      totalUsers,
      recentIncidents,
      recentAlerts
    ] = await Promise.all([
      // Total incidents
      Incident.countDocuments(baseFilter),
      
      // Today's incidents
      Incident.countDocuments({
        ...baseFilter,
        detectedAt: { $gte: today }
      }),
      
      // This week's incidents
      Incident.countDocuments({
        ...baseFilter,
        detectedAt: { $gte: weekAgo }
      }),
      
      // This month's incidents
      Incident.countDocuments({
        ...baseFilter,
        detectedAt: { $gte: monthAgo }
      }),
      
      // Incidents by status
      Incident.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      
      // Incidents by severity
      Incident.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]),
      
      // Incidents by type
      Incident.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      
      // Critical alerts for user
      Alert.countDocuments({
        'recipients.userId': userId,
        priority: 'critical',
        'recipients.status': { $ne: 'read' },
        isDeleted: false,
        expiresAt: { $gt: now }
      }),
      
      // Total videos
      Video.countDocuments({ isDeleted: false }),
      
      // Total users (admin only)
      userRole === 'admin' ? User.countDocuments({ isActive: true }) : Promise.resolve(0),
      
      // Recent incidents
      Incident.find(baseFilter)
        .populate('reportedBy', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ detectedAt: -1 })
        .limit(5),
      
      // Recent alerts for user
      Alert.find({
        'recipients.userId': userId,
        isDeleted: false,
        expiresAt: { $gt: now }
      })
        .populate('incidentId', 'incidentNumber title type')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    // Calculate trends
    const trendWeek = weekIncidents / (monthIncidents || 1) * 100;
    const trendToday = todayIncidents / (weekIncidents || 1) * 100;

    // Prepare response
    const dashboardData = {
      summary: {
        totalIncidents,
        todayIncidents,
        weekIncidents,
        monthIncidents,
        totalVideos,
        totalUsers: userRole === 'admin' ? totalUsers : null,
        criticalAlerts
      },
      trends: {
        weeklyGrowth: Math.round(trendWeek),
        dailyGrowth: Math.round(trendToday),
        comparedToPrevious: 'week'
      },
      distribution: {
        byStatus,
        bySeverity,
        byType
      },
      recent: {
        incidents: recentIncidents,
        alerts: recentAlerts
      },
      timestamp: new Date().toISOString()
    };

    ApiResponse.success(res, dashboardData, 'Dashboard statistics retrieved successfully');
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    ApiResponse.error(res, error, 'Failed to retrieve dashboard statistics');
  }
};

/**
 * Get real-time monitoring data
 */
const getRealTimeData = async (req, res) => {
  try {
    const userId = req.userId;

    const now = new Date();
    const lastHour = new Date(now);
    lastHour.setHours(lastHour.getHours() - 1);

    // Get real-time data
    const [
      recentIncidents,
      recentAlerts,
      activeIncidents,
      unreadAlerts
    ] = await Promise.all([
      // Incidents in last hour
      Incident.find({
        isDeleted: false,
        detectedAt: { $gte: lastHour }
      })
        .populate('reportedBy', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ detectedAt: -1 })
        .limit(10),
      
      // Alerts in last hour
      Alert.find({
        'recipients.userId': userId,
        isDeleted: false,
        createdAt: { $gte: lastHour }
      })
        .populate('incidentId', 'incidentNumber title type')
        .sort({ createdAt: -1 })
        .limit(10),
      
      // Active (pending/under_review) incidents
      Incident.countDocuments({
        isDeleted: false,
        status: { $in: ['pending', 'under_review'] }
      }),
      
      // Unread alerts count
      Alert.countDocuments({
        'recipients.userId': userId,
        'recipients.status': { $ne: 'read' },
        isDeleted: false,
        expiresAt: { $gt: now }
      })
    ]);

    const realTimeData = {
      activeIncidents,
      unreadAlerts,
      recentIncidents,
      recentAlerts,
      timestamp: now.toISOString(),
      lastUpdate: now.toISOString()
    };

    ApiResponse.success(res, realTimeData, 'Real-time data retrieved successfully');
  } catch (error) {
    logger.error('Get real-time data error:', error);
    ApiResponse.error(res, error, 'Failed to retrieve real-time data');
  }
};

/**
 * Get system health metrics
 */
const getSystemHealth = async (req, res) => {
  try {
    // Only admins can view system health
    if (req.userRole !== 'admin') {
      return ApiResponse.forbidden(res, 'Only administrators can view system health');
    }

    const now = new Date();
    const lastDay = new Date(now);
    lastDay.setDate(lastDay.getDate() - 1);

    const [
      totalUsers,
      activeUsers,
      totalIncidents,
      totalVideos,
      systemAlerts
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ 
        isActive: true,
        lastLogin: { $gte: lastDay }
      }),
      Incident.countDocuments({ isDeleted: false }),
      Video.countDocuments({ isDeleted: false }),
      Alert.countDocuments({
        isDeleted: false,
        priority: 'critical',
        'recipients.status': { $ne: 'read' }
      })
    ]);

    // Calculate storage usage (approximate)
    const videoStats = await Video.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$fileSize' } } }
    ]);
    const totalStorage = videoStats[0]?.total || 0;

    const healthData = {
      system: {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: now.toISOString()
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        activePercentage: totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0
      },
      data: {
        totalIncidents,
        totalVideos,
        storageUsed: totalStorage,
        storageUsedGB: (totalStorage / (1024 * 1024 * 1024)).toFixed(2)
      },
      alerts: {
        critical: systemAlerts,
        last24Hours: await Alert.countDocuments({
          isDeleted: false,
          createdAt: { $gte: lastDay }
        })
      },
      performance: {
        responseTime: `${Math.round(Math.random() * 50 + 20)}ms`, // Simulated
        requestsPerMinute: Math.round(Math.random() * 100 + 50), // Simulated
        errorRate: `${(Math.random() * 2 + 0.5).toFixed(2)}%` // Simulated
      }
    };

    ApiResponse.success(res, healthData, 'System health retrieved successfully');
  } catch (error) {
    logger.error('Get system health error:', error);
    ApiResponse.error(res, error, 'Failed to retrieve system health');
  }
};

/**
 * Get activity timeline
 */
const getActivityTimeline = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const userId = req.userId;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get incidents over time
    const timeline = await Incident.aggregate([
      {
        $match: {
          isDeleted: false,
          detectedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$detectedAt' } },
            severity: '$severity'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          data: {
            $push: {
              severity: '$_id.severity',
              count: '$count'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format response
    const formattedTimeline = timeline.map(item => {
      const severityData = {};
      item.data.forEach(d => {
        severityData[d.severity] = d.count;
      });
      return {
        date: item._id,
        ...severityData
      };
    });

    ApiResponse.success(res, {
      timeline: formattedTimeline,
      days: parseInt(days),
      startDate: startDate,
      endDate: new Date()
    }, 'Activity timeline retrieved successfully');
  } catch (error) {
    logger.error('Get activity timeline error:', error);
    ApiResponse.error(res, error, 'Failed to retrieve activity timeline');
  }
};

/**
 * Get top performers / most active users
 */
const getTopPerformers = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    const userId = req.userId;

    // Determine date range
    const now = new Date();
    let startDate = new Date(now);
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get top users by incident reports
    const topReporters = await Incident.aggregate([
      {
        $match: {
          isDeleted: false,
          detectedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$reportedBy',
          count: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          reports: '$count',
          resolved: '$resolved',
          resolutionRate: {
            $multiply: [
              { $divide: ['$resolved', '$count'] },
              100
            ]
          }
        }
      }
    ]);

    // Get top users by alerts handled
    const topAlertHandlers = await Alert.aggregate([
      {
        $match: {
          isDeleted: false,
          createdAt: { $gte: startDate },
          'recipients.status': 'read'
        }
      },
      { $unwind: '$recipients' },
      {
        $match: {
          'recipients.status': 'read'
        }
      },
      {
        $group: {
          _id: '$recipients.userId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          alertsHandled: '$count'
        }
      }
    ]);

    ApiResponse.success(res, {
      period,
      startDate,
      topReporters: topReporters.length > 0 ? topReporters : [],
      topAlertHandlers: topAlertHandlers.length > 0 ? topAlertHandlers : []
    }, 'Top performers retrieved successfully');
  } catch (error) {
    logger.error('Get top performers error:', error);
    ApiResponse.error(res, error, 'Failed to retrieve top performers');
  }
};

/**
 * Get incident heatmap data
 */
const getHeatmapData = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get incidents with location data
    const incidents = await Incident.find({
      isDeleted: false,
      detectedAt: { $gte: startDate },
      'location.coordinates': { $exists: true, $ne: null }
    });

    // Group by location
    const heatmapData = {};
    incidents.forEach(incident => {
      const key = incident.location.coordinates.join(',');
      if (!heatmapData[key]) {
        heatmapData[key] = {
          coordinates: incident.location.coordinates,
          count: 0,
          incidents: [],
          severity: {
            low: 0,
            medium: 0,
            high: 0,
            critical: 0
          }
        };
      }
      heatmapData[key].count += 1;
      heatmapData[key].incidents.push(incident._id);
      heatmapData[key].severity[incident.severity] = (heatmapData[key].severity[incident.severity] || 0) + 1;
    });

    // Convert to array
    const heatmapArray = Object.values(heatmapData);

    ApiResponse.success(res, {
      heatmapData: heatmapArray,
      totalLocations: heatmapArray.length,
      totalIncidents: incidents.length,
      days: parseInt(days),
      startDate
    }, 'Heatmap data retrieved successfully');
  } catch (error) {
    logger.error('Get heatmap data error:', error);
    ApiResponse.error(res, error, 'Failed to retrieve heatmap data');
  }
};

module.exports = {
  getDashboardStats,
  getRealTimeData,
  getSystemHealth,
  getActivityTimeline,
  getTopPerformers,
  getHeatmapData
};