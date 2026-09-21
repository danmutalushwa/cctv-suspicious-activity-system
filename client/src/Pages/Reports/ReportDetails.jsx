import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Trash2,
  Clock,
  Calendar,
  FileText,
} from 'lucide-react';
import { useState } from 'react';
import {
  useReport,
  useDeleteReport,
  useScheduleReport,
} from '../../hooks/useReports';
import { reportsAPI } from '../../api/reports';
import PageHeader from '../../components/Layout/PageHeader';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Badge from '../../components/Common/Badge';
import LoadingScreen from '../../components/Common/LoadingScreen';
import Alert from '../../components/Common/Alert';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import {
  REPORT_STATUS_COLORS,
  REPORT_STATUS_LABELS,
  REPORT_TYPE_LABELS,
  REPORT_FORMAT_LABELS,
} from '../../constants/reportTypes';
import { formatDate, formatRelativeTime } from '../../utils/formatDate';
import { formatFileSize } from '../../utils/formatFileSize';
import { ROUTES } from '../../constants/routes';
const ReportDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const { data, isLoading, isError, error } = useReport(id);
  const deleteMutation = useDeleteReport();
  const report = data?.data?.report;
  // ============================================
  // Loading
  // ============================================
  if (isLoading) {
    return <LoadingScreen message="Loading report..." />;
  }
  // ============================================
  // Error / Not Found
  // ============================================
  if (isError || !report) {
    return (
      <Alert
        type="danger"
        title="Report not found"
        message={
          error?.userMessage ||
          'The requested report could not be loaded.'
        }
      />
    );
  }
  // ============================================
  // Delete Report
  // ============================================
  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    navigate(ROUTES.REPORTS);
  };
  // ============================================
  // Download Report
  // ============================================
  const handleDownload = async () => {
    if (report.status !== 'completed') {
      return;
    }
    try {
      setDownloadLoading(true);
      setDownloadError('');
      // Request the file through Axios so that
      // the Authorization header is included.
      const response = await reportsAPI.downloadReportFile(
        report._id
      );
      // The backend returns the report as a Blob.
      const blob = new Blob(
        [response.data],
        {
          type:
            response.headers['content-type'] ||
            'application/pdf',
        }
      );
      // Create a temporary URL for the file.
      const downloadUrl = window.URL.createObjectURL(blob);
      // Create a temporary download link.
      const link = document.createElement('a');
      link.href = downloadUrl;
      // Use the report title as the filename.
      const safeTitle = (report.title || 'report')
        .replace(/[^a-z0-9_\-]/gi, '_')
        .replace(/_+/g, '_');
      const extension =
        report.format?.toLowerCase() === 'pdf'
          ? 'pdf'
          : report.format?.toLowerCase() || 'pdf';
      link.download = `${safeTitle}.${extension}`;
      // Trigger browser download.
      document.body.appendChild(link);
      link.click();
      // Clean up.
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (downloadErr) {
      console.error(
        'Report download failed:',
        downloadErr
      );
      setDownloadError(
        downloadErr?.response?.data?.message ||
          downloadErr?.userMessage ||
          'Failed to download the report. Please try again.'
      );
    } finally {
      setDownloadLoading(false);
    }
  };
  const isReady = report.status === 'completed';
  return (
    <>
      {/* ============================================
          Page Header
      ============================================ */}
      <PageHeader
        title={report.title}
        subtitle={report.description}
        breadcrumbs={[
          {
            label: 'Reports',
            path: ROUTES.REPORTS,
          },
          {
            label: report.title,
          },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={ArrowLeft}
              onClick={() => navigate(ROUTES.REPORTS)}
            >
              Back
            </Button>
            <Button
              variant="primary"
              icon={Download}
              onClick={handleDownload}
              disabled={!isReady || downloadLoading}
              loading={downloadLoading}
            >
              Download
            </Button>
            <Button
              variant="danger"
              icon={Trash2}
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </Button>
          </div>
        }
      />
      {/* ============================================
          Download Error
      ============================================ */}
      {downloadError && (
        <Alert
          type="danger"
          title="Download failed"
          message={downloadError}
          className="mb-6"
        />
      )}
      {/* ============================================
          Main Content
      ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* ========================================
              Status
          ======================================== */}
          <Card title="Status">
            <div className="flex items-center gap-3 mb-4">
              <Badge
                variant={REPORT_STATUS_COLORS[report.status]}
                dot
                size="lg"
              >
                {REPORT_STATUS_LABELS[report.status]}
              </Badge>
              {report.status === 'generating' && (
                <span className="text-sm text-secondary-500">
                  Generating report... this may take a moment.
                </span>
              )}
            </div>
            {report.status === 'completed' && (
              <div className="p-4 rounded-lg bg-success-50 dark:bg-success-900/20 flex items-center gap-3">
                <FileText
                  className="text-success-600 dark:text-success-400"
                  size={24}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-success-900 dark:text-success-200">
                    Report ready for download
                  </p>
                  <p className="text-xs text-success-700 dark:text-success-300">
                    {report.fileSize &&
                      formatFileSize(report.fileSize)}
                    {' · '}
                    {REPORT_FORMAT_LABELS[report.format]}
                  </p>
                </div>
                <Button
                  variant="success"
                  size="sm"
                  icon={Download}
                  onClick={handleDownload}
                  loading={downloadLoading}
                  disabled={downloadLoading}
                >
                  Download
                </Button>
              </div>
            )}
            {report.status === 'failed' && (
              <Alert
                type="danger"
                title="Report generation failed"
                message={
                  report.processingError ||
                  'An error occurred while generating the report. Please try again.'
                }
              />
            )}
          </Card>
          {/* ========================================
              Summary
          ======================================== */}
          {report.generatedData?.summary && (
            <Card title="Summary Statistics">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-secondary-500">
                    Total Incidents
                  </p>
                  <p className="text-xl font-bold text-secondary-900 dark:text-white">
                    {report.generatedData.summary.totalIncidents || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-secondary-500">
                    Resolved
                  </p>
                  <p className="text-xl font-bold text-success-600 dark:text-success-400">
                    {report.generatedData.summary.totalResolved || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-secondary-500">
                    Avg. Resolution
                  </p>
                  <p className="text-xl font-bold text-secondary-900 dark:text-white">
                    {report.generatedData.summary.averageResolutionTime || 0}
                    h
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
        {/* ============================================
            Sidebar
        ============================================ */}
        <div className="space-y-6">
          {/* ========================================
              Report Details
          ======================================== */}
          <Card title="Details">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-secondary-500">
                  Type
                </span>
                <span className="font-medium">
                  {REPORT_TYPE_LABELS[report.type]}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-secondary-500">
                  Format
                </span>
                <span className="font-medium uppercase">
                  {report.format}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-secondary-500">
                  Created
                </span>
                <span className="font-medium">
                  {formatRelativeTime(report.createdAt)}
                </span>
              </li>
              {report.parameters?.startDate && (
                <li className="flex items-start justify-between gap-2">
                  <span className="text-secondary-500">
                    Period
                  </span>
                  <span className="font-medium text-right text-xs">
                    {formatDate(
                      report.parameters.startDate,
                      'MMM dd'
                    )}{' '}
                    -{' '}
                    {formatDate(
                      report.parameters.endDate,
                      'MMM dd, yyyy'
                    )}
                  </span>
                </li>
              )}
              {report.fileSize && (
                <li className="flex items-center justify-between">
                  <span className="text-secondary-500">
                    Size
                  </span>
                  <span className="font-medium">
                    {formatFileSize(report.fileSize)}
                  </span>
                </li>
              )}
              {report.downloadCount > 0 && (
                <li className="flex items-center justify-between">
                  <span className="text-secondary-500">
                    Downloads
                  </span>
                  <span className="font-medium">
                    {report.downloadCount}
                  </span>
                </li>
              )}
            </ul>
          </Card>
          {/* ========================================
              Filters Applied
          ======================================== */}
          {report.parameters?.filters && (
            <Card title="Filters Applied">
              <div className="space-y-3 text-sm">
                {report.parameters.filters.incidentTypes?.length > 0 && (
                  <div>
                    <p className="text-xs text-secondary-500 mb-1">
                      Types
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {report.parameters.filters.incidentTypes.map(
                        (type) => (
                          <Badge
                            key={type}
                            variant="secondary"
                            size="sm"
                          >
                            {type}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}
                {report.parameters.filters.severity?.length > 0 && (
                  <div>
                    <p className="text-xs text-secondary-500 mb-1">
                      Severity
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {report.parameters.filters.severity.map(
                        (severity) => (
                          <Badge
                            key={severity}
                            variant="warning"
                            size="sm"
                          >
                            {severity}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}
                {report.parameters.filters.status?.length > 0 && (
                  <div>
                    <p className="text-xs text-secondary-500 mb-1">
                      Status
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {report.parameters.filters.status.map(
                        (status) => (
                          <Badge
                            key={status}
                            variant="info"
                            size="sm"
                          >
                            {status}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
      {/* ============================================
          Delete Confirmation
      ============================================ */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Report"
        message="Are you sure you want to delete this report? This action cannot be undone."
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </>
  );
};
export default ReportDetails;