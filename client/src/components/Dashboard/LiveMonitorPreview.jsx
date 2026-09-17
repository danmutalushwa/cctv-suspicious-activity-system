import { Link } from 'react-router-dom';
import { ArrowRight, Activity } from 'lucide-react';
import Card from '../Common/Card';
import Button from '../Common/Button';
import { useLiveCameras } from '../../hooks/useMonitoring';
import { CAMERA_STATUS } from '../../constants/cameraStatus';
import { ROUTES } from '../../constants/routes';

const LiveMonitorPreview = () => {
  const { data, isLoading } = useLiveCameras({ limit: 4 });
  const cameras = data?.data?.cameras || [];

  const onlineCount = cameras.filter(
    (c) => c.status === CAMERA_STATUS.ONLINE || c.status === CAMERA_STATUS.RECORDING
  ).length;

  return (
    <Card
      title="Live Monitoring"
      subtitle={`${onlineCount} of ${cameras.length} cameras online`}
      headerAction={
        <Link to={ROUTES.REAL_TIME}>
          <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right">
            View All
          </Button>
        </Link>
      }
    >
      {isLoading ? (
        <div className="aspect-video bg-secondary-100 dark:bg-secondary-700 rounded-lg animate-pulse" />
      ) : cameras.length === 0 ? (
        <div className="aspect-video rounded-lg bg-secondary-50 dark:bg-secondary-900/40 flex items-center justify-center">
          <div className="text-center">
            <Activity size={32} className="text-secondary-400 mx-auto mb-2" />
            <p className="text-xs text-secondary-500">No cameras available</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {cameras.slice(0, 4).map((camera) => (
            <Link
              key={camera._id}
              to={ROUTES.REAL_TIME}
              className="relative aspect-video rounded-lg bg-gradient-to-br from-secondary-800 to-secondary-900 overflow-hidden group"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity
                  size={20}
                  className={
                    camera.status === CAMERA_STATUS.OFFLINE
                      ? 'text-secondary-600'
                      : 'text-white/40'
                  }
                />
              </div>
              <div className="absolute bottom-1 left-1 right-1 flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    camera.status === CAMERA_STATUS.RECORDING
                      ? 'bg-danger-500 animate-pulse'
                      : camera.status === CAMERA_STATUS.ONLINE
                        ? 'bg-success-500'
                        : 'bg-secondary-500'
                  }`}
                />
                <p className="text-white text-[10px] truncate font-medium">
                  {camera.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
};

export default LiveMonitorPreview;