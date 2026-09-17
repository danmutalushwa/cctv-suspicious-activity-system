import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Wifi, WifiOff, Circle, AlertTriangle } from 'lucide-react';
import { CAMERA_STATUS, CAMERA_STATUS_LABELS } from '../../constants/cameraStatus';

const CameraStatus = ({ status, showLabel = true, size = 'md' }) => {
  const config = {
    [CAMERA_STATUS.ONLINE]: {
      icon: Wifi,
      color: 'text-success-600 dark:text-success-400',
      bg: 'bg-success-100 dark:bg-success-900/30',
      dot: 'bg-success-500',
      pulse: false,
    },
    [CAMERA_STATUS.RECORDING]: {
      icon: Circle,
      color: 'text-danger-600 dark:text-danger-400',
      bg: 'bg-danger-100 dark:bg-danger-900/30',
      dot: 'bg-danger-500',
      pulse: true,
    },
    [CAMERA_STATUS.OFFLINE]: {
      icon: WifiOff,
      color: 'text-secondary-500 dark:text-secondary-400',
      bg: 'bg-secondary-100 dark:bg-secondary-700',
      dot: 'bg-secondary-400',
      pulse: false,
    },
    [CAMERA_STATUS.ERROR]: {
      icon: AlertTriangle,
      color: 'text-warning-600 dark:text-warning-400',
      bg: 'bg-warning-100 dark:bg-warning-900/30',
      dot: 'bg-warning-500',
      pulse: false,
    },
  };

  const cfg = config[status] || config[CAMERA_STATUS.OFFLINE];
  const Icon = cfg.icon;

  const sizes = {
    sm: { icon: 12, text: 'text-xs' },
    md: { icon: 14, text: 'text-sm' },
    lg: { icon: 16, text: 'text-base' },
  };

  return (
    <div className={classNames('inline-flex items-center gap-2', showLabel && cfg.bg, showLabel && 'px-2.5 py-1 rounded-full')}>
      <span className="relative flex">
        <span className={classNames('w-2 h-2 rounded-full', cfg.dot)} />
        {cfg.pulse && (
          <span className={classNames('absolute inset-0 w-2 h-2 rounded-full animate-ping', cfg.dot)} />
        )}
      </span>
      {showLabel && (
        <span className={classNames('font-medium', sizes[size].text, cfg.color)}>
          {CAMERA_STATUS_LABELS[status] || status}
        </span>
      )}
    </div>
  );
};

CameraStatus.propTypes = {
  status: PropTypes.string.isRequired,
  showLabel: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
};

export default CameraStatus;