import PropTypes from 'prop-types';
import { Clock, MessageSquare, User, FileCheck } from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatDate';

const IncidentTimeline = ({ notes = [], activity = [] }) => {
  const getIcon = (type) => {
    const icons = {
      note: MessageSquare,
      assignment: User,
      resolution: FileCheck,
      default: Clock,
    };
    return icons[type] || icons.default;
  };

  const getIconColor = (type) => {
    const colors = {
      note: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
      assignment: 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400',
      resolution: 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400',
      default: 'bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-400',
    };
    return colors[type] || colors.default;
  };

  const items = [...notes, ...activity].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-secondary-500 dark:text-secondary-400">
        No activity yet
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-secondary-200 dark:bg-secondary-700" />
      <ul className="space-y-4">
        {items.map((item, index) => {
          const Icon = getIcon(item.type);
          return (
            <li key={index} className="relative flex gap-3">
              <div
                className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getIconColor(item.type)}`}
              >
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0 pt-1.5">
                <p className="text-sm text-secondary-900 dark:text-white">
                  {item.text || item.title}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-secondary-500">
                  {item.createdBy?.name && <span>{item.createdBy.name}</span>}
                  <span>·</span>
                  <span>{formatRelativeTime(item.createdAt)}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

IncidentTimeline.propTypes = {
  notes: PropTypes.array,
  activity: PropTypes.array,
};

export default IncidentTimeline;