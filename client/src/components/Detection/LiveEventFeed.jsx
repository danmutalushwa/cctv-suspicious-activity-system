import PropTypes from 'prop-types';
import {
  Bell,
  AlertTriangle,
  Video,
  Camera as CameraIcon,
  Check,
  Trash2,
} from 'lucide-react';
import classNames from 'classnames';
import { formatRelativeTime } from '../../utils/formatDate';
import Badge from '../Common/Badge';

const LiveEventFeed = ({ events = [], onClear, alertCount = 0 }) => {
  const getIcon = (type) => {
    const icons = {
      alert: AlertTriangle,
      incident: Bell,
      stream_started: Video,
      camera_event: CameraIcon,
    };
    return icons[type] || Bell;
  };

  const getColorClasses = (type) => {
    const colors = {
      alert: 'bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400',
      incident: 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400',
      stream_started: 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400',
      camera_event: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    };
    return colors[type] || 'bg-secondary-100 text-secondary-600';
  };

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-secondary-200 dark:border-secondary-700">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-secondary-900 dark:text-white">
            Live Events
          </h3>
          {alertCount > 0 && (
            <Badge variant="danger" size="sm">
              {alertCount}
            </Badge>
          )}
        </div>
        {events.length > 0 && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="p-1 rounded text-secondary-400 hover:text-danger-500 transition-colors"
            title="Clear events"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Events */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-10 h-10 rounded-full bg-secondary-100 dark:bg-secondary-700 flex items-center justify-center mb-2">
              <Check size={18} className="text-secondary-400" />
            </div>
            <p className="text-xs text-secondary-500 dark:text-secondary-400">
              No live events
            </p>
            <p className="text-xs text-secondary-400 mt-0.5">
              Events will appear here in real-time
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {events.map((event, index) => {
              const Icon = getIcon(event.type);
              return (
                <li
                  key={index}
                  className={classNames(
                    'flex items-start gap-2.5 p-2.5 rounded-lg animate-fade-in',
                    'bg-secondary-50 dark:bg-secondary-700/40'
                  )}
                >
                  <div
                    className={classNames(
                      'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center',
                      getColorClasses(event.type)
                    )}
                  >
                    <Icon size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-secondary-900 dark:text-white truncate">
                      {event.alert?.title ||
                        event.incident?.title ||
                        event.cameraName ||
                        'Event'}
                    </p>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400 line-clamp-2 mt-0.5">
                      {event.alert?.message ||
                        event.incident?.description ||
                        `Stream started for ${event.cameraName}`}
                    </p>
                    <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">
                      {formatRelativeTime(event.timestamp)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

LiveEventFeed.propTypes = {
  events: PropTypes.array,
  onClear: PropTypes.func,
  alertCount: PropTypes.number,
};

export default LiveEventFeed;