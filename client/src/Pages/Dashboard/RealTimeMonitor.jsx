import { useState, useMemo } from 'react';
import {
  RefreshCw,
  Search,
  Camera as CameraIcon,
  Activity,
  Bell,
} from 'lucide-react';
import { useLiveCameras, useLiveEvents } from '../../hooks/useMonitoring';
import { useSocket } from '../../hooks/useSocket';
import PageHeader from '../../components/Layout/PageHeader';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Badge from '../../components/Common/Badge';
import SearchBar from '../../components/Common/SearchBar';
import Select from '../../components/Common/Select';
import Alert from '../../components/Common/Alert';
import {
  CameraGridLayout,
  LiveEventFeed,
} from '../../components/Detection';
import { CAMERA_STATUS_OPTIONS } from '../../constants/cameraStatus';
import classNames from 'classnames';

const RealTimeMonitor = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeCamera, setActiveCamera] = useState(null);
  const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);

  const { isConnected } = useSocket();
  const { events, alertCount, clearEvents } = useLiveEvents();

  const { data, isLoading, isError, error, refetch } = useLiveCameras({
    ...(statusFilter && { status: statusFilter }),
  });

  const allCameras = data?.data?.cameras || [];

  const filteredCameras = useMemo(() => {
    let list = allCameras;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.location?.toLowerCase().includes(q) ||
          c.ipAddress?.toLowerCase().includes(q)
      );
    }

    if (filterOnlineOnly) {
      list = list.filter((c) => c.status === 'online' || c.status === 'recording');
    }

    return list;
  }, [allCameras, search, filterOnlineOnly]);

  const onlineCount = allCameras.filter(
    (c) => c.status === 'online' || c.status === 'recording'
  ).length;
  const recordingCount = allCameras.filter((c) => c.status === 'recording').length;

  const handleSelectCamera = (camera) => {
    setActiveCamera(camera);
  };

  return (
    <>
      <PageHeader
        title="Real-Time Monitoring"
        subtitle="Live view of all connected cameras"
        actions={
          <div className="flex items-center gap-2">
            <div
              className={classNames(
                'hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                isConnected
                  ? 'bg-success-100 dark:bg-success-900/30'
                  : 'bg-danger-100 dark:bg-danger-900/30'
              )}
            >
              <span
                className={classNames(
                  'w-2 h-2 rounded-full',
                  isConnected ? 'bg-success-500 animate-pulse' : 'bg-danger-500'
                )}
              />
              <span
                className={classNames(
                  'text-xs font-medium',
                  isConnected
                    ? 'text-success-700 dark:text-success-300'
                    : 'text-danger-700 dark:text-danger-300'
                )}
              >
                {isConnected ? 'Live' : 'Disconnected'}
              </span>
            </div>
            <Button
              variant="outline"
              icon={RefreshCw}
              onClick={refetch}
              loading={isLoading}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-500">Total Cameras</p>
              <p className="text-xl font-bold text-secondary-900 dark:text-white">
                {allCameras.length}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <CameraIcon size={16} className="text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-500">Online</p>
              <p className="text-xl font-bold text-success-600 dark:text-success-400">
                {onlineCount}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
              <Activity size={16} className="text-success-600 dark:text-success-400" />
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-500">Recording</p>
              <p className="text-xl font-bold text-danger-600 dark:text-danger-400">
                {recordingCount}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-danger-500 animate-pulse" />
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-500">Live Alerts</p>
              <p className="text-xl font-bold text-warning-600 dark:text-warning-400">
                {alertCount}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
              <Bell size={16} className="text-warning-600 dark:text-warning-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search cameras..."
            />
          </div>
          <div className="flex items-center gap-3">
            <Select
              name="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={CAMERA_STATUS_OPTIONS}
              placeholder="All Statuses"
              className="min-w-[160px]"
            />
            <button
              type="button"
              onClick={() => setFilterOnlineOnly(!filterOnlineOnly)}
              className={classNames(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                filterOnlineOnly
                  ? 'bg-success-500 text-white'
                  : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300'
              )}
            >
              Online only
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

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <CameraGridLayout
            cameras={filteredCameras}
            activeCamera={activeCamera}
            onSelect={handleSelectCamera}
          />
        </div>
        <div className="lg:col-span-1">
          <div className="sticky top-24 h-[calc(100vh-8rem)]">
            <LiveEventFeed
              events={events}
              alertCount={alertCount}
              onClear={clearEvents}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default RealTimeMonitor;