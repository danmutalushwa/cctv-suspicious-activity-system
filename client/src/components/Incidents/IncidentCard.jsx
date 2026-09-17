import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { MapPin, Clock, User, AlertTriangle } from 'lucide-react';
import Badge from '../Common/Badge';
import {
  INCIDENT_STATUS_COLORS,
  INCIDENT_STATUS_LABELS,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
} from '../../constants/status';
import { INCIDENT_TYPE_LABELS } from '../../constants/incidentTypes';
import { formatRelativeTime } from '../../utils/formatDate';
import { buildRoute } from '../../constants/routes';

const IncidentCard = ({ incident }) => {
  return (
    <Link
      to={buildRoute.incidentDetails(incident._id)}
      className="block bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-secondary-500">
              {incident.incidentNumber}
            </span>
            <Badge variant={SEVERITY_COLORS[incident.severity]} size="sm">
              {SEVERITY_LABELS[incident.severity]}
            </Badge>
          </div>
          <h3 className="text-base font-semibold text-secondary-900 dark:text-white truncate">
            {incident.title}
          </h3>
        </div>
        <Badge variant={INCIDENT_STATUS_COLORS[incident.status]} size="sm" dot>
          {INCIDENT_STATUS_LABELS[incident.status]}
        </Badge>
      </div>

      <p className="text-sm text-secondary-600 dark:text-secondary-400 line-clamp-2 mb-3">
        {incident.description}
      </p>

      <div className="flex flex-wrap items-center gap-3 text-xs text-secondary-500 dark:text-secondary-400">
        <div className="flex items-center gap-1">
          <AlertTriangle size={12} />
          <span>{INCIDENT_TYPE_LABELS[incident.type] || incident.type}</span>
        </div>

        {incident.location?.address && (
          <div className="flex items-center gap-1">
            <MapPin size={12} />
            <span className="truncate max-w-[150px]">{incident.location.address}</span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <Clock size={12} />
          <span>{formatRelativeTime(incident.detectedAt)}</span>
        </div>

        {incident.assignedTo?.name && (
          <div className="flex items-center gap-1">
            <User size={12} />
            <span>{incident.assignedTo.name}</span>
          </div>
        )}
      </div>
    </Link>
  );
};

IncidentCard.propTypes = {
  incident: PropTypes.object.isRequired,
};

export default IncidentCard;