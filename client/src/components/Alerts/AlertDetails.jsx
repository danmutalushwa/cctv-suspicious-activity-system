import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Users,
  Mail,
  Info,
} from 'lucide-react';
import Card from '../Common/Card';
import Badge from '../Common/Badge';
import Button from '../Common/Button';
import {
  ALERT_PRIORITY_COLORS,
  ALERT_PRIORITY_LABELS,
  ALERT_STATUS,
} from '../../constants/alertTypes';
import { formatDate, formatRelativeTime } from '../../utils/formatDate';
import { buildRoute } from '../../constants/routes';

const AlertDetails = ({ alert, onAcknowledge, onMarkAsRead, loading }) => {
  if (!alert) return null;

  const recipient = alert.recipients?.[0];
  const isRead = recipient?.status === 'read';
  const isAcknowledged = alert.isAcknowledged;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <div className="flex items-start gap-4 mb-6">
            <div
              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                alert.priority === 'critical'
                  ? 'bg-danger-100 dark:bg-danger-900/30'
                  : alert.priority === 'high'
                    ? 'bg-warning-100 dark:bg-warning-900/30'
                    : 'bg-primary-100 dark:bg-primary-900/30'
              }`}
            >
              <Bell
                size={22}
                className={
                  alert.priority === 'critical'
                    ? 'text-danger-600 dark:text-danger-400'
                    : alert.priority === 'high'
                      ? 'text-warning-600 dark:text-warning-400'
                      : 'text-primary-600 dark:text-primary-400'
                }
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={ALERT_PRIORITY_COLORS[alert.priority]} dot>
                  {ALERT_PRIORITY_LABELS[alert.priority]}
                </Badge>
                {isAcknowledged && (
                  <Badge variant="success" dot>
                    Acknowledged
                  </Badge>
                )}
                {!isRead && <Badge variant="primary">Unread</Badge>}
              </div>
              <h1 className="text-xl font-bold text-secondary-900 dark:text-white">
                {alert.title}
              </h1>
            </div>
          </div>

          <p className="text-sm text-secondary-700 dark:text-secondary-300 whitespace-pre-wrap">
            {alert.message}
          </p>

          <div className="mt-6 pt-6 border-t border-secondary-200 dark:border-secondary-700 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-secondary-500 mb-1">Created</p>
              <p className="text-secondary-900 dark:text-white">
                {formatDate(alert.createdAt, 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            <div>
              <p className="text-xs text-secondary-500 mb-1">Type</p>
              <p className="text-secondary-900 dark:text-white capitalize">
                {alert.type?.replace('_', ' ')}
              </p>
            </div>
          </div>
        </Card>

        {alert.incidentId && (
          <Card title="Related Incident">
            <Link
              to={buildRoute.incidentDetails(alert.incidentId._id || alert.incidentId)}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary-50 dark:bg-secondary-700/50 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
                <AlertTriangle size={18} className="text-warning-600 dark:text-warning-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                  {alert.incidentId.title || 'View Incident'}
                </p>
                {alert.incidentId.incidentNumber && (
                  <p className="text-xs text-secondary-500 font-mono">
                    {alert.incidentId.incidentNumber}
                  </p>
                )}
              </div>
            </Link>
          </Card>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Actions */}
        <Card title="Actions">
          <div className="space-y-2">
            {!isRead && (
              <Button
                variant="outline"
                fullWidth
                icon={Info}
                onClick={() => onMarkAsRead(alert._id)}
                loading={loading}
              >
                Mark as Read
              </Button>
            )}
            {!isAcknowledged && (
              <Button
                variant="success"
                fullWidth
                icon={CheckCircle2}
                onClick={() => onAcknowledge(alert._id)}
                loading={loading}
              >
                Acknowledge Alert
              </Button>
            )}
            {isAcknowledged && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-success-50 dark:bg-success-900/20">
                <CheckCircle2 size={16} className="text-success-600 dark:text-success-400" />
                <span className="text-sm text-success-700 dark:text-success-300">
                  Acknowledged
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Recipients */}
        {alert.recipients && alert.recipients.length > 0 && (
          <Card title={`Recipients (${alert.recipients.length})`}>
            <ul className="space-y-3">
              {alert.recipients.slice(0, 5).map((r, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary-200 dark:bg-secondary-700 flex items-center justify-center">
                    <Users size={14} className="text-secondary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-secondary-900 dark:text-white truncate">
                      {r.userId?.name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-secondary-500 truncate">
                      {r.userId?.email}
                    </p>
                  </div>
                  <Badge
                    variant={
                      r.status === 'read'
                        ? 'success'
                        : r.status === 'sent'
                          ? 'info'
                          : 'secondary'
                    }
                    size="sm"
                  >
                    {r.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Metadata */}
        {alert.metadata && (
          <Card title="Details">
            <ul className="space-y-2 text-sm">
              {alert.metadata.location && (
                <li className="flex justify-between gap-2">
                  <span className="text-secondary-500">Location:</span>
                  <span className="text-secondary-900 dark:text-white text-right">
                    {alert.metadata.location}
                  </span>
                </li>
              )}
              {alert.metadata.severity && (
                <li className="flex justify-between gap-2">
                  <span className="text-secondary-500">Severity:</span>
                  <span className="text-secondary-900 dark:text-white capitalize">
                    {alert.metadata.severity}
                  </span>
                </li>
              )}
              {alert.metadata.cameraName && (
                <li className="flex justify-between gap-2">
                  <span className="text-secondary-500">Camera:</span>
                  <span className="text-secondary-900 dark:text-white">
                    {alert.metadata.cameraName}
                  </span>
                </li>
              )}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
};

AlertDetails.propTypes = {
  alert: PropTypes.object,
  onAcknowledge: PropTypes.func,
  onMarkAsRead: PropTypes.func,
  loading: PropTypes.bool,
};

export default AlertDetails;