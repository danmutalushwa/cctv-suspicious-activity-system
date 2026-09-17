const Report = require('../models/Report');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');
const reportService = require('../services/report.service');
const fs = require('fs');
const path = require('path');

/**
 * Create a report
 */
const createReport = async (req, res) => {
  try {
    const reportData = {
      ...req.body,
      generatedBy: req.userId,
      status: 'pending'
    };

    // Validate dates
    if (reportData.parameters?.startDate && reportData.parameters?.endDate) {
      const start = new Date(reportData.parameters.startDate);
      const end = new Date(reportData.parameters.endDate);
      
      if (start > end) {
        return ApiResponse.badRequest(res, 'Start date must be before end date');
      }
      
      if ((end - start) > 90 * 24 * 60 * 60 * 1000) {
        return ApiResponse.badRequest(res, 'Date range cannot exceed 90 days');
      }
    }

    const report = await Report.create(reportData);

    // Generate report in background
    generateReportAsync(report._id);

    logger.info(`Report created: ${report.title} by ${req.user.email}`);

    ApiResponse.created(res, {
      report,
      message: 'Report generation started. You will be notified when completed.'
    }, 'Report created successfully');
  } catch (error) {
    logger.error('Create report error:', error);
    ApiResponse.error(res, error, 'Failed to create report');
  }
};

/**
 * Generate report asynchronously
 */
const generateReportAsync = async (reportId) => {
  try {
    const report = await Report.findById(reportId);
    if (!report) {
      logger.error(`Report not found: ${reportId}`);
      return;
    }

    report.status = 'generating';
    await report.save();

    const result = await reportService.generateReport(report);

    // Emit socket event for completion
    const io = require('../app').get('io');
    if (io) {
      io.sendToUser(report.generatedBy, 'report_generated', {
        reportId: report._id,
        title: report.title,
        filePath: result.filePath,
        fileName: result.fileName,
        fileSize: result.fileSize,
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`Report generated: ${reportId}`);
  } catch (error) {
    logger.error(`Report generation failed for ${reportId}:`, error);
    await Report.findByIdAndUpdate(reportId, {
      status: 'failed'
    });
  }
};

/**
 * Get all reports
 */
const getAllReports = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      status,
      format,
      startDate,
      endDate
    } = req.query;

    const filter = {
      generatedBy: req.userId,
      isDeleted: false
    };

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (format) filter.format = format;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('generatedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Report.countDocuments(filter)
    ]);

    ApiResponse.success(res, {
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Reports retrieved successfully');
  } catch (error) {
    logger.error('Get reports error:', error);
    ApiResponse.error(res, error, 'Failed to retrieve reports');
  }
};

/**
 * Get report by ID
 */
const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id)
      .populate('generatedBy', 'name email');

    if (!report || report.isDeleted) {
      return ApiResponse.notFound(res, 'Report not found');
    }

    // Check access
    if (report.generatedBy._id.toString() !== req.userId.toString() && 
        req.userRole !== 'admin') {
      return ApiResponse.forbidden(res, 'You do not have access to this report');
    }

    ApiResponse.success(res, {
      report
    }, 'Report retrieved successfully');
  } catch (error) {
    logger.error('Get report error:', error);
    ApiResponse.error(res, error, 'Failed to retrieve report');
  }
};

/**
 * Download report
 */
const downloadReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id);
    if (!report || report.isDeleted) {
      return ApiResponse.notFound(res, 'Report not found');
    }

    // Check access
    if (report.generatedBy.toString() !== req.userId.toString() && 
        req.userRole !== 'admin') {
      return ApiResponse.forbidden(res, 'You do not have access to this report');
    }

    if (report.status !== 'completed') {
      return ApiResponse.badRequest(res, `Report is ${report.status}. Please wait for completion.`);
    }

    if (!report.filePath || !fs.existsSync(report.filePath)) {
      return ApiResponse.notFound(res, 'Report file not found');
    }

    // Increment download count
    await report.incrementDownloads();

    // Download file
    const fileName = report.filePath.split('/').pop();
    res.download(report.filePath, fileName, (err) => {
      if (err) {
        logger.error('Download report error:', err);
        if (!res.headersSent) {
          ApiResponse.error(res, err, 'Failed to download report');
        }
      } else {
        logger.info(`Report downloaded: ${report._id} by ${req.user.email}`);
      }
    });
  } catch (error) {
    logger.error('Download report error:', error);
    ApiResponse.error(res, error, 'Failed to download report');
  }
};

/**
 * Delete report
 */
const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id);
    if (!report || report.isDeleted) {
      return ApiResponse.notFound(res, 'Report not found');
    }

    // Check access
    if (report.generatedBy.toString() !== req.userId.toString() && 
        req.userRole !== 'admin') {
      return ApiResponse.forbidden(res, 'You do not have permission to delete this report');
    }

    // Delete file if exists
    if (report.filePath && fs.existsSync(report.filePath)) {
      fs.unlinkSync(report.filePath);
    }

    report.isDeleted = true;
    await report.save();

    logger.info(`Report deleted: ${report._id} by ${req.user.email}`);

    ApiResponse.success(res, null, 'Report deleted successfully');
  } catch (error) {
    logger.error('Delete report error:', error);
    ApiResponse.error(res, error, 'Failed to delete report');
  }
};

/**
 * Get report statistics
 */
const getReportStatistics = async (req, res) => {
  try {
    const stats = await Report.getStatistics(req.userId);
    
    const statistics = {
      total: stats[0].total[0]?.count || 0,
      byType: stats[0].byType || [],
      byStatus: stats[0].byStatus || [],
      byFormat: stats[0].byFormat || [],
      recent: stats[0].recent || []
    };

    ApiResponse.success(res, statistics, 'Report statistics retrieved successfully');
  } catch (error) {
    logger.error('Get report statistics error:', error);
    ApiResponse.error(res, error, 'Failed to retrieve statistics');
  }
};

/**
 * Schedule report
 */
const scheduleReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled, frequency, time, dayOfWeek, dayOfMonth, emailRecipients } = req.body;

    const report = await Report.findById(id);
    if (!report || report.isDeleted) {
      return ApiResponse.notFound(res, 'Report not found');
    }

    // Check access
    if (report.generatedBy.toString() !== req.userId.toString() && 
        req.userRole !== 'admin') {
      return ApiResponse.forbidden(res, 'You do not have permission to schedule this report');
    }

    report.schedule = {
      enabled,
      frequency,
      time,
      dayOfWeek,
      dayOfMonth,
      lastGeneratedAt: report.schedule?.lastGeneratedAt || null,
      nextGenerationAt: calculateNextGeneration(frequency, time, dayOfWeek, dayOfMonth)
    };

    if (emailRecipients) {
      report.delivery.email = {
        enabled: true,
        recipients: emailRecipients
      };
    }

    await report.save();

    logger.info(`Report scheduled: ${report._id} by ${req.user.email}`);

    ApiResponse.success(res, {
      report
    }, 'Report scheduled successfully');
  } catch (error) {
    logger.error('Schedule report error:', error);
    ApiResponse.error(res, error, 'Failed to schedule report');
  }
};

/**
 * Calculate next generation time for scheduled report
 */
const calculateNextGeneration = (frequency, time, dayOfWeek, dayOfMonth) => {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  
  let nextDate = new Date(now);
  nextDate.setHours(hours, minutes, 0, 0);

  switch (frequency) {
    case 'daily':
      if (nextDate <= now) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      break;
    
    case 'weekly':
      const currentDay = now.getDay();
      const daysUntil = (dayOfWeek - currentDay + 7) % 7;
      nextDate.setDate(nextDate.getDate() + daysUntil);
      if (nextDate <= now) {
        nextDate.setDate(nextDate.getDate() + 7);
      }
      break;
    
    case 'monthly':
      nextDate.setDate(dayOfMonth);
      if (nextDate <= now) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      break;
    
    default:
      nextDate = null;
  }

  return nextDate;
};

module.exports = {
  createReport,
  getAllReports,
  getReportById,
  downloadReport,
  deleteReport,
  getReportStatistics,
  scheduleReport,
  generateReportAsync
};