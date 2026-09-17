import { useState } from 'react';
import { Plus, Upload, LayoutGrid, List } from 'lucide-react';
import { useVideos, useDeleteVideo, useVideoStatistics } from '../../hooks/useVideos';
import { usePagination } from '../../hooks/usePagination';
import { useAuth } from '../../hooks/useAuth';
import PageHeader from '../../components/Layout/PageHeader';
import Button from '../../components/Common/Button';
import Card from '../../components/Common/Card';
import Pagination from '../../components/Common/Pagination';
import Alert from '../../components/Common/Alert';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import EmptyState from '../../components/Common/EmptyState';
import SearchBar from '../../components/Common/SearchBar';
import Select from '../../components/Common/Select';
import { VideoCard, VideoUploadModal } from '../../components/Videos';
import { hasPermission } from '../../utils/permissions';
import classNames from 'classnames';

const VideoLibrary = () => {
  const { user } = useAuth();
  const [showUpload, setShowUpload] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const canUpload = hasPermission(user?.role, 'videos:create');
  const canDelete = hasPermission(user?.role, 'videos:delete');

  const pagination = usePagination(1, 12);

  const queryParams = {
    page: pagination.page,
    limit: pagination.limit,
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter }),
  };

  const { data, isLoading, isError, error } = useVideos(queryParams);
  const { data: statsData } = useVideoStatistics();
  const deleteMutation = useDeleteVideo();

  const videos = data?.data?.videos || [];
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

  const handleReset = () => {
    setSearch('');
    setStatusFilter('');
    pagination.setPage(1);
  };

  const hasFilters = search || statusFilter;

  return (
    <>
      <PageHeader
        title="Video Library"
        subtitle="Manage your CCTV recordings and evidence"
        actions={
          canUpload && (
            <Button
              variant="primary"
              icon={Upload}
              onClick={() => setShowUpload(true)}
            >
              Upload Video
            </Button>
          )
        }
      />

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card padding="sm">
          <p className="text-xs text-secondary-500">Total Videos</p>
          <p className="text-xl font-bold text-secondary-900 dark:text-white">
            {stats?.total || 0}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-secondary-500">Storage Used</p>
          <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
            {stats?.totalSizeMB || 0} MB
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-secondary-500">Processing</p>
          <p className="text-xl font-bold text-warning-600 dark:text-warning-400">
            {stats?.byStatus?.find((s) => s._id === 'processing')?.count || 0}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-secondary-500">Completed</p>
          <p className="text-xl font-bold text-success-600 dark:text-success-400">
            {stats?.byStatus?.find((s) => s._id === 'completed')?.count || 0}
          </p>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              pagination.setPage(1);
            }}
            placeholder="Search videos..."
          />
          <Select
            name="status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              pagination.setPage(1);
            }}
            options={[
              { value: 'completed', label: 'Completed' },
              { value: 'processing', label: 'Processing' },
              { value: 'failed', label: 'Failed' },
            ]}
            placeholder="All Statuses"
          />
          {hasFilters && (
            <Button variant="outline" onClick={handleReset}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {isError && (
        <Alert
          type="danger"
          title="Failed to load videos"
          message={error?.userMessage || 'Please try again later.'}
          className="mb-6"
        />
      )}

      {/* View Toggle */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-secondary-500 dark:text-secondary-400">
          {isLoading ? 'Loading...' : `${totalItems} video(s)`}
        </p>
        <div className="flex items-center gap-1 bg-secondary-100 dark:bg-secondary-800 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={classNames(
              'p-1.5 rounded transition-colors',
              viewMode === 'grid'
                ? 'bg-white dark:bg-secondary-700 shadow-sm'
                : 'text-secondary-500'
            )}
            aria-label="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={classNames(
              'p-1.5 rounded transition-colors',
              viewMode === 'list'
                ? 'bg-white dark:bg-secondary-700 shadow-sm'
                : 'text-secondary-500'
            )}
            aria-label="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-video bg-secondary-100 dark:bg-secondary-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No videos found' : 'No videos yet'}
          description={
            hasFilters
              ? 'Try adjusting your filters.'
              : 'Upload your first video to get started.'
          }
          action={
            canUpload && (
              <Button variant="primary" icon={Plus} onClick={() => setShowUpload(true)}>
                Upload Video
              </Button>
            )
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <VideoCard
              key={video._id}
              video={video}
              onDelete={canDelete ? setDeleteTarget : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((video) => (
            <VideoCard
              key={video._id}
              video={video}
              onDelete={canDelete ? setDeleteTarget : undefined}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && videos.length > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={totalItems}
            pageSize={pagination.limit}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.changeLimit}
            pageSizes={[12, 24, 48]}
          />
        </div>
      )}

      {/* Modals */}
      <VideoUploadModal isOpen={showUpload} onClose={() => setShowUpload(false)} />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Video"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </>
  );
};

export default VideoLibrary;