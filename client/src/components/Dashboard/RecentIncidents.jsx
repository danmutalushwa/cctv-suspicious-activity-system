import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import Card from '../Common/Card';
import Badge from '../Common/Badge';
import EmptyState from '../Common/EmptyState';
import Skeleton from '../Common/Skeleton';
import {
  INCIDENT_STATUS_COLORS,
  INCIDENT_STATUS_LABELS,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
} from '../../constants/status';
import { INCIDENT_TYPE_LABELS } from '../../constants/incidentTypes';
import { formatRelativeTime } from '../../utils/formatDate';
import { buildRoute, ROUTES } from '../../constants/routes';

const RecentIncidents = ({ incidents = [], loading = false }) => {
  if (loading) {
    return (
      <Card title="Recent Incidents">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton variant="circle" width={40} height={40} />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Recent Incidents"
      headerAction={
        <Link
          to={ROUTES.INCIDENTS}
          className="flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700"
        >
          View all
          <ArrowRight size={14} />
        </Link>
      }
    >
      {incidents.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No incidents"
          description="No recent incidents to display."
        />
      ) : (
        <ul className="space-y-3">
          {incidents.map((incident) => (
            <li key={incident._id}>
              <Link
                to={buildRoute.incidentDetails(incident._id)}
                className="block p-3 rounded-lg border border-secondary-200 dark:border-secondary-700 hover:border-primary-300 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                      {incident.title}
                    </p>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">
                      {INCIDENT_TYPE_LABELS[incident.type] || incident.type} ·{' '}
                      {formatRelativeTime(incident.detectedAt)}
                    </p>
                  </div>
                  <Badge variant={SEVERITY_COLORS[incident.severity]} size="sm">
                    {SEVERITY_LABELS[incident.severity]}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={INCIDENT_STATUS_COLORS[incident.status]} size="sm" dot>
                    {INCIDENT_STATUS_LABELS[incident.status]}
                  </Badge>
                  {incident.incidentNumber && (
                    <span className="text-xs text-secondary-400 font-mono">
                      {incident.incidentNumber}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

RecentIncidents.propTypes = {
  incidents: PropTypes.array,
  loading: PropTypes.bool,
};

export default RecentIncidents;