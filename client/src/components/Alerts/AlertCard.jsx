import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Bell, Clock, AlertTriangle, CheckCircle2, Circle } from 'lucide-react';
import classNames from 'classnames';
import Badge from '../Common/Badge';
import { ALERT_PRIORITY_COLORS, ALERT_PRIORITY_LABELS } from '../../constants/alertTypes';
import { formatRelativeTime } from '../../utils/formatDate';
import { buildRoute } from '../../constants/routes';

const AlertCard = ({ alert, onMarkAsRead, onAcknowledge, compact = false }) => {
  const isRead = alert.recipients?.[0]?.status === 'read';

  return (
    <div
      className={classNames(
        'bg-white dark:bg-secondary-800 rounded-lg border p-4 transition-colors',
        !isRead
          ? 'border-primary-300 dark:border-primary-800 bg-primary-50/30 dark:bg-primary-900/10'
          : 'border-secondary-200 dark:border-secondary-700'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Priority Indicator */}
        <div className="flex-shrink-0 pt-1">
          <div
            className={classNames(
              'w-2.5 h-2.5 rounded-full',
              alert.priority === 'critical'
                ? 'bg-danger-500 animate-pulse'
                : alert.priority === 'high'
                  ? 'bg-warning-500'
                  : alert.priority === 'medium'
                    ? 'bg-primary-500'
                    : 'bg-success-500'
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <Link
              to={buildRoute.alertDetails(alert._id)}
              className="flex-1 min-w-0"
            >
              <h3
                className={classNames(
                  'text-sm font-semibold truncate hover:text-primary-600 transition-colors',
                  isRead
                    ? 'text-secondary-700 dark:text-secondary-300'
                    : 'text-secondary-900 dark:text-white'
                )}
              >
                {alert.title}
              </h3>
            </Link>
            <Badge variant={ALERT_PRIORITY_COLORS[alert.priority]} size="sm">
              {ALERT_PRIORITY_LABELS[alert.priority]}
            </Badge>
          </div>

          <p className="text-sm text-secondary-600 dark:text-secondary-400 line-clamp-2 mb-2">
            {alert.message}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-secondary-500 dark:text-secondary-400">
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{formatRelativeTime(alert.createdAt)}</span>
            </div>

            {alert.incidentId && (
              <Link
                to={buildRoute.incidentDetails(alert.incidentId._id || alert.incidentId)}
                className="flex items-center gap-1 text-primary-600 hover:underline"
              >
                <AlertTriangle size={12} />
                <span>View Incident</span>
              </Link>
            )}

            {alert.isAcknowledged && (
              <div className="flex items-center gap-1 text-success-600 dark:text-success-400">
                <CheckCircle2 size={12} />
                <span>Acknowledged</span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {!compact && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-secondary-100 dark:border-secondary-700">
              {!isRead && onMarkAsRead && (
                <button
                  type="button"
                  onClick={() => onMarkAsRead(alert._id)}
                  className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700"
                >
                  Mark as Read
                </button>
              )}
              {!alert.isAcknowledged && onAcknowledge && (
                <button
                  type="button"
                  onClick={() => onAcknowledge(alert._id)}
                  className="text-xs font-medium text-success-600 dark:text-success-400 hover:text-success-700"
                >
                  Acknowledge
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

AlertCard.propTypes = {
  alert: PropTypes.object.isRequired,
  onMarkAsRead: PropTypes.func,
  onAcknowledge: PropTypes.func,
  compact: PropTypes.bool,
};

export default AlertCard;