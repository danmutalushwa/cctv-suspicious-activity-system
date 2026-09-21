import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  FileText,
  Download,
  Trash2,
  MoreVertical,
  Calendar,
  HardDrive,
} from 'lucide-react';
import { useState } from 'react';
import Badge from '../Common/Badge';
import {
  REPORT_STATUS_COLORS,
  REPORT_STATUS_LABELS,
  REPORT_TYPE_LABELS,
  REPORT_FORMAT_LABELS,
} from '../../constants/reportTypes';
import { formatRelativeTime } from '../../utils/formatDate';
import { formatFileSize } from '../../utils/formatFileSize';
import { buildRoute } from '../../constants/routes';
import { reportsAPI } from '../../api/reports';

const ReportCard = ({ report, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (report.status !== 'completed' || isDownloading) return;
    
    try {
      setIsDownloading(true);
      
      // 1. Invoke the forced-auth binary stream request handler
      const response = await reportsAPI.downloadReportFile(report._id);

      // 2. Safely capture the data payload regardless of interceptor unpacking mutations
      const binaryPayload = response.data || response;
      
      // 3. Compile the binary chunks into a localized downloadable PDF blob instance
      const blob = new Blob([binaryPayload], { type: 'application/pdf' });
      const fileUrl = window.URL.createObjectURL(blob);
      
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = fileUrl;
      downloadAnchor.setAttribute('download', `${report.title.replace(/\s+/g, '_')}.pdf`);
      
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      
      // 4. Memory optimization cleanup
      document.body.removeChild(downloadAnchor);
      window.URL.revokeObjectURL(fileUrl);
    } catch (error) {
      console.error('Binary PDF construction sequence failed:', error);
    } finally {
      setIsDownloading(false);
      setShowMenu(false);
    }
  };

  const getFormatIcon = () => {
    return <FileText size={20} />;
  };

  const getFormatColor = () => {
    const colors = {
      pdf: 'bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400',
      excel: 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400',
      csv: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
      json: 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400',
    };
    return colors[report.format] || 'bg-secondary-100 text-secondary-600';
  };

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getFormatColor()}`}>
          {getFormatIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <Link to={buildRoute.reportDetails(report._id)} className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-secondary-900 dark:text-white truncate hover:text-primary-600 transition-colors">
                {report.title}
              </h3>
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                onBlur={() => setTimeout(() => setShowMenu(false), 200)}
                className="p-1 rounded hover:bg-secondary-100 dark:hover:bg-secondary-700"
              >
                <MoreVertical size={16} className="text-secondary-500" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-8 z-10 w-40 bg-white dark:bg-secondary-800 rounded-lg shadow-dropdown border border-secondary-200 dark:border-secondary-700 py-1 animate-fade-in">
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={report.status !== 'completed' || isDownloading}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download size={14} />
                    {isDownloading ? 'Downloading...' : 'Download'}
                  </button>
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(report);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {report.description && (
            <p className="text-xs text-secondary-500 dark:text-secondary-400 line-clamp-2 mb-2">
              {report.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant={REPORT_STATUS_COLORS[report.status]} size="sm" dot>
              {REPORT_STATUS_LABELS[report.status]}
            </Badge>
            <Badge variant="secondary" size="sm">
              {REPORT_TYPE_LABELS[report.type]}
            </Badge>
            <Badge variant="outline" size="sm">
              {REPORT_FORMAT_LABELS[report.format]}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-secondary-500 dark:text-secondary-400">
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{formatRelativeTime(report.createdAt)}</span>
            </div>
            {report.fileSize && (
              <div className="flex items-center gap-1">
                <HardDrive size={12} />
                <span>{formatFileSize(report.fileSize)}</span>
              </div>
            )}
            {report.downloadCount > 0 && (
              <div className="flex items-center gap-1">
                <Download size={12} />
                <span>{report.downloadCount}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

ReportCard.propTypes = {
  report: PropTypes.object.isRequired,
  onDelete: PropTypes.func,
};

export default ReportCard;
