import PropTypes from 'prop-types';
import { Inbox } from 'lucide-react';

const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No data found',
  description = 'There is nothing to display here yet.',
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-secondary-100 dark:bg-secondary-700 flex items-center justify-center mb-4">
        <Icon size={28} className="text-secondary-400" />
      </div>
      <h3 className="text-base font-semibold text-secondary-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-sm text-secondary-500 dark:text-secondary-400 max-w-sm mb-6">
        {description}
      </p>
      {action}
    </div>
  );
};

EmptyState.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string,
  description: PropTypes.string,
  action: PropTypes.node,
};

export default EmptyState;