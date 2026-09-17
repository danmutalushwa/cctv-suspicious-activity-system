import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import { useReports, useDeleteReport, useReportStatistics } from '../../hooks/useReports';
import { usePagination } from '../../hooks/usePagination';
import PageHeader from '../../components/Layout/PageHeader';
import Button from '../../components/Common/Button';
import Card from '../../components/Common/Card';
import Pagination from '../../components/Common/Pagination';
import Alert from '../../components/Common/Alert';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import EmptyState from '../../components/Common/EmptyState';
import SearchBar from '../../components/Common/SearchBar';
import Select from '../../components/Common/Select';
import { ReportCard } from '../../components/Reports';
import { ROUTES } from '../../constants/routes';
import { REPORT_STATUS_OPTIONS, REPORT_TYPE_OPTIONS } from '../../constants/reportTypes';

const ReportList = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const pagination = usePagination(1, 10);
  const deleteMutation = useDeleteReport();

  const queryParams = {
    page: pagination.page,
    limit: pagination.limit,
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter }),
    ...(typeFilter && { type: typeFilter }),
  };

  const { data, isLoading, isError, error } = useReports(queryParams);
  const { data: statsData } = useReportStatistics();

  const reports = data?.data?.reports || [];
  const totalItems = data?.data?.pagination?.total || 0;
  const stats = statsData?.data;

  if (data?.data?.pagination?.total !== undefined && pagination.total !== totalItems) {
    pagination.setTotal(totalItems);
  }

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteMutation.mutateAsync(deleteTarget._id);
      setDeleteTarget(null);
    }
  };

  const hasFilters = search || statusFilter || typeFilter;

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Generate and manage analytical reports"
        actions={
          <Link to={ROUTES.GENERATE_REPORT}>
            <Button variant="primary" icon={Plus}>
              Generate Report
            </Button>
          </Link>
        }
      />

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card padding="sm">
          <p className="text-xs text-secondary-500">Total Reports</p>
          <p className="text-xl font-bold text-secondary-900 dark:text-white">
            {stats?.total || 0}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-secondary-500">Completed</p>
          <p className="text-xl font-bold text-success-600 dark:text-success-400">
            {stats?.byStatus?.find((s) => s._id === 'completed')?.count || 0}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-secondary-500">Generating</p>
          <p className="text-xl font-bold text-warning-600 dark:text-warning-400">
            {stats?.byStatus?.find((s) => s._id === 'generating')?.count || 0}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-secondary-500">Failed</p>
          <p className="text-xl font-bold text-danger-600 dark:text-danger-400">
            {stats?.byStatus?.find((s) => s._id === 'failed')?.count || 0}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              pagination.setPage(1);
            }}
            placeholder="Search reports..."
          />
          <Select
            name="status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              pagination.setPage(1);
            }}
            options={REPORT_STATUS_OPTIONS}
            placeholder="All Statuses"
          />
          <Select
            name="type"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              pagination.setPage(1);
            }}
            options={REPORT_TYPE_OPTIONS}
            placeholder="All Types"
          />
        </div>
      </div>

      {isError && (
        <Alert
          type="danger"
          title="Failed to load reports"
          message={error?.userMessage || 'Please try again later.'}
          className="mb-6"
        />
      )}

      {/* Reports List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-secondary-100 dark:bg-secondary-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={hasFilters ? 'No reports found' : 'No reports yet'}
          description={
            hasFilters
              ? 'Try adjusting your filters.'
              : 'Generate your first report to get started.'
          }
          action={
            <Link to={ROUTES.GENERATE_REPORT}>
              <Button variant="primary" icon={Plus}>
                Generate Report
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <ReportCard
              key={report._id}
              report={report}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && reports.length > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={totalItems}
            pageSize={pagination.limit}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.changeLimit}
          />
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Report"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </>
  );
};

export default ReportList;