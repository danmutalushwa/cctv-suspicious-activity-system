const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const Incident = require('../models/Incident');
const Video = require('../models/Video');
const Alert = require('../models/Alert');

/**
 * Generate incident summary report
 */
const generateIncidentSummaryReport = async (report) => {
  try {
    const { startDate, endDate, filters, grouping } = report.parameters;
    
    // Get incident data
    const matchQuery = {
      detectedAt: { $gte: startDate, $lte: endDate },
      isDeleted: false
    };

    if (filters?.incidentTypes?.length) {
      matchQuery.type = { $in: filters.incidentTypes };
    }
    if (filters?.severity?.length) {
      matchQuery.severity = { $in: filters.severity };
    }
    if (filters?.status?.length) {
      matchQuery.status = { $in: filters.status };
    }
    if (filters?.cameraIds?.length) {
      matchQuery['location.cameraId'] = { $in: filters.cameraIds };
    }
    if (filters?.assignedTo) {
      matchQuery.assignedTo = filters.assignedTo;
    }

    // Get statistics
    const [totalIncidents, byType, bySeverity, byStatus, byDay, incidents] = await Promise.all([
      Incident.countDocuments(matchQuery),
      Incident.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Incident.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Incident.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Incident.aggregate([
        { $match: matchQuery },
        { 
          $group: { 
            _id: { 
              $dateToString: { 
                format: `%Y-%m-%d`, 
                date: '$detectedAt' 
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Incident.find(matchQuery)
        .populate('reportedBy', 'name email')
        .populate('assignedTo', 'name email')
        .populate('location.cameraId', 'name location')
        .sort({ detectedAt: -1 })
        .limit(100)
    ]);

    // Calculate average resolution time
    const resolvedIncidents = await Incident.find({
      ...matchQuery,
      status: 'resolved',
      'resolution.resolvedAt': { $exists: true }
    });

    let avgResolutionTime = 0;
    if (resolvedIncidents.length > 0) {
      const totalTime = resolvedIncidents.reduce((sum, inc) => {
        const resolvedAt = new Date(inc.resolution.resolvedAt);
        const detectedAt = new Date(inc.detectedAt);
        return sum + (resolvedAt - detectedAt);
      }, 0);
      avgResolutionTime = totalTime / resolvedIncidents.length / (1000 * 60 * 60); // in hours
    }

    // Prepare report data
    const reportData = {
      title: report.title,
      description: report.description,
      generatedAt: new Date(),
      dateRange: {
        start: startDate,
        end: endDate
      },
      summary: {
        totalIncidents,
        totalResolved: resolvedIncidents.length,
        averageResolutionTime: avgResolutionTime.toFixed(2),
        mostCommonType: byType[0]?._id || 'N/A',
        mostSevereIncident: bySeverity[0]?._id || 'N/A'
      },
      statistics: {
        byType,
        bySeverity,
        byStatus,
        byDay
      },
      incidents: incidents
    };

    return reportData;
  } catch (error) {
    logger.error('Generate incident summary error:', error);
    throw error;
  }
};

/**
 * Generate PDF report
 */
const generatePDFReport = async (reportData, report) => {
  return new Promise((resolve, reject) => {
    try {
      const outputDir = path.join(__dirname, '../../uploads/reports');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const fileName = `${uuidv4()}.pdf`;
      const filePath = path.join(outputDir, fileName);

      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Header
      doc.fontSize(20)
        .text(reportData.title, { align: 'center' })
        .moveDown();

      doc.fontSize(12)
        .text(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`, { align: 'center' })
        .moveDown();

      // Date Range
      doc.fontSize(14)
        .text('Date Range')
        .fontSize(12)
        .text(`From: ${new Date(reportData.dateRange.start).toLocaleDateString()}`)
        .text(`To: ${new Date(reportData.dateRange.end).toLocaleDateString()}`)
        .moveDown();

      // Summary
      doc.fontSize(14)
        .text('Summary Statistics')
        .moveDown(0.5);

      const summaryData = [
        ['Total Incidents', reportData.summary.totalIncidents.toString()],
        ['Total Resolved', reportData.summary.totalResolved.toString()],
        ['Average Resolution Time', `${reportData.summary.averageResolutionTime} hours`],
        ['Most Common Type', reportData.summary.mostCommonType],
        ['Most Severe', reportData.summary.mostSevereIncident]
      ];

      summaryData.forEach(([label, value]) => {
        doc.fontSize(12)
          .text(`${label}: ${value}`, { indent: 20 });
      });
      doc.moveDown();

      // Statistics Tables
      if (reportData.statistics.byType.length > 0) {
        doc.fontSize(14)
          .text('Incidents by Type')
          .moveDown(0.5);

        const tableTop = doc.y;
        let x = 50;
        doc.fontSize(10);
        doc.text('Type', x, tableTop);
        doc.text('Count', x + 200, tableTop);

        let y = tableTop + 20;
        reportData.statistics.byType.forEach((item) => {
          doc.text(item._id, x, y);
          doc.text(item.count.toString(), x + 200, y);
          y += 20;
        });
        doc.moveDown(2);
      }

      // Add more sections as needed...

      doc.end();

      writeStream.on('finish', () => {
        const stats = fs.statSync(filePath);
        resolve({
          filePath,
          fileName,
          fileSize: stats.size
        });
      });

      writeStream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate Excel report
 */
const generateExcelReport = async (reportData, report) => {
  try {
    const outputDir = path.join(__dirname, '../../uploads/reports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `${uuidv4()}.xlsx`;
    const filePath = path.join(outputDir, fileName);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CCTV Security System';
    workbook.created = new Date();

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 30 }
    ];

    summarySheet.addRow({ metric: 'Report Title', value: reportData.title });
    summarySheet.addRow({ metric: 'Generated At', value: reportData.generatedAt.toLocaleString() });
    summarySheet.addRow({ metric: 'Date Range', value: `${reportData.dateRange.start.toLocaleDateString()} - ${reportData.dateRange.end.toLocaleDateString()}` });
    summarySheet.addRow({ metric: 'Total Incidents', value: reportData.summary.totalIncidents });
    summarySheet.addRow({ metric: 'Total Resolved', value: reportData.summary.totalResolved });
    summarySheet.addRow({ metric: 'Average Resolution Time (hours)', value: reportData.summary.averageResolutionTime });

    // Incidents by Type sheet
    if (reportData.statistics.byType.length > 0) {
      const typeSheet = workbook.addWorksheet('By Type');
      typeSheet.columns = [
        { header: 'Type', key: 'type', width: 25 },
        { header: 'Count', key: 'count', width: 15 }
      ];
      typeSheet.addRows(reportData.statistics.byType.map(item => ({
        type: item._id,
        count: item.count
      })));
    }

    // Incidents by Severity sheet
    if (reportData.statistics.bySeverity.length > 0) {
      const severitySheet = workbook.addWorksheet('By Severity');
      severitySheet.columns = [
        { header: 'Severity', key: 'severity', width: 20 },
        { header: 'Count', key: 'count', width: 15 }
      ];
      severitySheet.addRows(reportData.statistics.bySeverity.map(item => ({
        severity: item._id,
        count: item.count
      })));
    }

    // Incidents by Status sheet
    if (reportData.statistics.byStatus.length > 0) {
      const statusSheet = workbook.addWorksheet('By Status');
      statusSheet.columns = [
        { header: 'Status', key: 'status', width: 20 },
        { header: 'Count', key: 'count', width: 15 }
      ];
      statusSheet.addRows(reportData.statistics.byStatus.map(item => ({
        status: item._id,
        count: item.count
      })));
    }

    // Incidents detail sheet
    if (reportData.incidents.length > 0) {
      const incidentSheet = workbook.addWorksheet('Incident Details');
      incidentSheet.columns = [
        { header: 'Incident Number', key: 'incidentNumber', width: 18 },
        { header: 'Title', key: 'title', width: 30 },
        { header: 'Type', key: 'type', width: 20 },
        { header: 'Severity', key: 'severity', width: 15 },
        { header: 'Status', key: 'status', width: 18 },
        { header: 'Detected At', key: 'detectedAt', width: 25 },
        { header: 'Reported By', key: 'reportedBy', width: 25 }
      ];

      incidentSheet.addRows(reportData.incidents.map(inc => ({
        incidentNumber: inc.incidentNumber,
        title: inc.title,
        type: inc.type,
        severity: inc.severity,
        status: inc.status,
        detectedAt: inc.detectedAt.toLocaleString(),
        reportedBy: inc.reportedBy?.name || 'N/A'
      })));
    }

    await workbook.xlsx.writeFile(filePath);

    const stats = fs.statSync(filePath);
    return {
      filePath,
      fileName,
      fileSize: stats.size
    };

  } catch (error) {
    logger.error('Generate Excel error:', error);
    throw error;
  }
};

/**
 * Generate report based on type and format
 */
const generateReport = async (report) => {
  try {
    // Generate report data
    let reportData;
    switch (report.type) {
      case 'incident_summary':
      case 'daily_activity':
      case 'weekly_analytics':
      case 'monthly_report':
      default:
        reportData = await generateIncidentSummaryReport(report);
        break;
    }

    // Generate file based on format
    let fileResult;
    switch (report.format) {
      case 'pdf':
        fileResult = await generatePDFReport(reportData, report);
        break;
      case 'excel':
        fileResult = await generateExcelReport(reportData, report);
        break;
      case 'csv':
        // TODO: Implement CSV generation
        throw new Error('CSV format not yet implemented');
      case 'json':
        // TODO: Implement JSON generation
        throw new Error('JSON format not yet implemented');
      default:
        throw new Error(`Unsupported format: ${report.format}`);
    }

    // Update report with generated data
    report.generatedData = reportData;
    report.filePath = fileResult.filePath;
    report.fileSize = fileResult.fileSize;
    report.status = 'completed';
    report.generatedAt = new Date();

    await report.save();

    logger.info(`Report generated: ${report._id} (${report.format})`);

    return {
      report,
      filePath: fileResult.filePath,
      fileName: fileResult.fileName,
      fileSize: fileResult.fileSize
    };

  } catch (error) {
    logger.error('Generate report error:', error);
    report.status = 'failed';
    await report.save();
    throw error;
  }
};

/**
 * Clean up old reports
 */
const cleanupOldReports = async (daysToKeep = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const oldReports = await Report.find({
      createdAt: { $lt: cutoffDate },
      isDeleted: false
    });

    let deletedCount = 0;
    for (const report of oldReports) {
      try {
        // Delete file if exists
        if (report.filePath && fs.existsSync(report.filePath)) {
          fs.unlinkSync(report.filePath);
        }
        report.isDeleted = true;
        await report.save();
        deletedCount++;
      } catch (error) {
        logger.error(`Failed to cleanup report ${report._id}:`, error);
      }
    }

    logger.info(`Cleaned up ${deletedCount} old reports`);
    return deletedCount;
  } catch (error) {
    logger.error('Cleanup reports error:', error);
    throw error;
  }
};

module.exports = {
  generateReport,
  generateIncidentSummaryReport,
  generatePDFReport,
  generateExcelReport,
  cleanupOldReports
};