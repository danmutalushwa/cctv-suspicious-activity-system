import PropTypes from 'prop-types';
import classNames from 'classnames';

const Badge = ({ children, variant = 'default', size = 'md', dot = false, className }) => {
  const variants = {
    default: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-200',
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
    success: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300',
    warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300',
    danger: 'bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-300',
    info: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
    secondary: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-200',
    outline: 'border border-secondary-300 text-secondary-700 dark:border-secondary-600 dark:text-secondary-300',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  const dotColors = {
    default: 'bg-secondary-500',
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
    info: 'bg-primary-500',
    secondary: 'bg-secondary-500',
    outline: 'bg-secondary-500',
  };

  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && <span className={classNames('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
};

Badge.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'primary', 'success', 'warning', 'danger', 'info', 'secondary', 'outline']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  dot: PropTypes.bool,
  className: PropTypes.string,
};

export default Badge;