import PropTypes from 'prop-types';
import AlertCard from './AlertCard';
import EmptyState from '../Common/EmptyState';
import Skeleton from '../Common/Skeleton';
import { Bell } from 'lucide-react';

const AlertList = ({ alerts = [], loading = false, onMarkAsRead, onAcknowledge }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-4"
          >
            <Skeleton variant="text" width="60%" />
            <div className="mt-2">
              <Skeleton variant="text" width="90%" />
            </div>
            <div className="mt-2">
              <Skeleton variant="text" width="40%" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="No alerts found"
        description="You're all caught up! No alerts match your criteria."
      />
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <AlertCard
          key={alert._id}
          alert={alert}
          onMarkAsRead={onMarkAsRead}
          onAcknowledge={onAcknowledge}
        />
      ))}
    </div>
  );
};

AlertList.propTypes = {
  alerts: PropTypes.array,
  loading: PropTypes.bool,
  onMarkAsRead: PropTypes.func,
  onAcknowledge: PropTypes.func,
};

export default AlertList;