import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Bell, ArrowRight } from 'lucide-react';
import Card from '../Common/Card';
import Badge from '../Common/Badge';
import EmptyState from '../Common/EmptyState';
import Skeleton from '../Common/Skeleton';
import { ALERT_PRIORITY_COLORS, ALERT_PRIORITY_LABELS } from '../../constants/alertTypes';
import { formatRelativeTime } from '../../utils/formatDate';
import { ROUTES } from '../../constants/routes';

const RecentAlerts = ({ alerts = [], loading = false }) => {
  if (loading) {
    return (
      <Card title="Recent Alerts">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton variant="text" width="70%" />
              <Skeleton variant="text" width="40%" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Recent Alerts"
      headerAction={
        <Link
          to={ROUTES.ALERTS}
          className="flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700"
        >
          View all
          <ArrowRight size={14} />
        </Link>
      }
    >
      {alerts.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No alerts"
          description="No recent alerts to display."
        />
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert) => (
            <li
              key={alert._id}
              className="p-3 rounded-lg border border-secondary-200 dark:border-secondary-700"
            >
              <div className="flex items-start justify-between gap-3 mb-1">
                <p className="text-sm font-medium text-secondary-900 dark:text-white line-clamp-2">
                  {alert.title}
                </p>
                <Badge variant={ALERT_PRIORITY_COLORS[alert.priority]} size="sm">
                  {ALERT_PRIORITY_LABELS[alert.priority]}
                </Badge>
              </div>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 line-clamp-2">
                {alert.message}
              </p>
              <p className="text-xs text-secondary-400 mt-1.5">
                {formatRelativeTime(alert.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

RecentAlerts.propTypes = {
  alerts: PropTypes.array,
  loading: PropTypes.bool,
};

export default RecentAlerts;