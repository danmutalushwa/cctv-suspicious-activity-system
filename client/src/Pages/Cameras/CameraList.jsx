import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Camera as CameraIcon, LayoutGrid, List } from 'lucide-react';
import { useCameras, useDeleteCamera, useCameraStatistics } from '../../hooks/useCameras';
import { useAuth } from '../../hooks/useAuth';
import { hasPermission } from '../../utils/permissions';
import PageHeader from '../../components/Layout/PageHeader';
import Button from '../../components/Common/Button';
import Card from '../../components/Common/Card';
import Alert from '../../components/Common/Alert';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import SearchBar from '../../components/Common/SearchBar';
import Select from '../../components/Common/Select';
import { CameraGrid } from '../../components/Cameras';
import { ROUTES } from '../../constants/routes';
import { CAMERA_STATUS_OPTIONS } from '../../constants/cameraStatus';
import classNames from 'classnames';

const CameraList = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const canManage = hasPermission(user?.role, 'cameras:create');

  const { data, isLoading, isError, error } = useCameras({
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter }),
  });
  const { data: statsData } = useCameraStatistics();
  const deleteMutation = useDeleteCamera();

  const cameras = data?.data?.cameras || [];
  const stats = statsData?.data;

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteMutation.mutateAsync(deleteTarget._id);
      setDeleteTarget(null);
    }
  };

  const hasFilters = search || statusFilter;

  return (
    <>
      <PageHeader
        title="Cameras"
        subtitle="Manage your CCTV cameras and streams"
        actions={
          canManage && (
            <Link to={ROUTES.ADD_CAMERA}>
              <Button variant="primary" icon={Plus}>
                Add Camera
              </Button>
            </Link>
          )
        }
      />

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card padding="sm">
          <p className="text-xs text-secondary-500">Total Cameras</p>
          <p className="text-xl font-bold text-secondary-900 dark:text-white">
            {stats?.total || cameras.length}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-secondary-500">Online</p>
          <p className="text-xl font-bold text-success-600 dark:text-success-400">
            {stats?.online || cameras.filter((c) => c.status === 'online').length}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-secondary-500">Offline</p>
          <p className="text-xl font-bold text-secondary-500">
            {stats?.offline || cameras.filter((c) => c.status === 'offline').length}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-secondary-500">Recording</p>
          <p className="text-xl font-bold text-danger-600 dark:text-danger-400">
            {stats?.recording || cameras.filter((c) => c.status === 'recording').length}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search cameras..."
          />
          <Select
            name="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={CAMERA_STATUS_OPTIONS}
            placeholder="All Statuses"
          />
          <div className="flex items-center justify-end gap-1 bg-secondary-100 dark:bg-secondary-800 rounded-lg p-1">
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
      </div>

      {isError && (
        <Alert
          type="danger"
          title="Failed to load cameras"
          message={error?.userMessage || 'Please try again later.'}
          className="mb-6"
        />
      )}

      <CameraGrid
        cameras={cameras}
        loading={isLoading}
        onDelete={canManage ? setDeleteTarget : undefined}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Camera"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </>
  );
};

export default CameraList;