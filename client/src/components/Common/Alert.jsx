import PropTypes from 'prop-types';
import classNames from 'classnames';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

const Alert = ({ type = 'info', title, message, className, onClose }) => {
  const types = {
    info: {
      bg: 'bg-primary-50 dark:bg-primary-900/20',
      border: 'border-primary-200 dark:border-primary-800',
      text: 'text-primary-800 dark:text-primary-200',
      icon: Info,
    },
    success: {
      bg: 'bg-success-50 dark:bg-success-900/20',
      border: 'border-success-200 dark:border-success-800',
      text: 'text-success-800 dark:text-success-200',
      icon: CheckCircle,
    },
    warning: {
      bg: 'bg-warning-50 dark:bg-warning-900/20',
      border: 'border-warning-200 dark:border-warning-800',
      text: 'text-warning-800 dark:text-warning-200',
      icon: AlertCircle,
    },
    danger: {
      bg: 'bg-danger-50 dark:bg-danger-900/20',
      border: 'border-danger-200 dark:border-danger-800',
      text: 'text-danger-800 dark:text-danger-200',
      icon: XCircle,
    },
  };

  const { bg, border, text, icon: Icon } = types[type];

  return (
    <div className={classNames('rounded-lg border p-4', bg, border, className)}>
      <div className="flex items-start">
        <Icon className={classNames('h-5 w-5 flex-shrink-0', text)} />
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={classNames('text-sm font-medium', text)}>{title}</h3>
          )}
          {message && (
            <div className={classNames('text-sm', text, title && 'mt-1')}>{message}</div>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={classNames('ml-3 flex-shrink-0', text, 'hover:opacity-75')}
          >
            <span className="sr-only">Close</span>
            <XCircle className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

Alert.propTypes = {
  type: PropTypes.oneOf(['info', 'success', 'warning', 'danger']),
  title: PropTypes.string,
  message: PropTypes.string,
  className: PropTypes.string,
  onClose: PropTypes.func,
};

export default Alert;