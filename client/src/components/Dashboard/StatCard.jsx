import PropTypes from 'prop-types';
import classNames from 'classnames';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = 'primary',
  loading = false,
}) => {
  const colorClasses = {
    primary: {
      bg: 'bg-primary-100 dark:bg-primary-900/30',
      text: 'text-primary-600 dark:text-primary-400',
    },
    success: {
      bg: 'bg-success-100 dark:bg-success-900/30',
      text: 'text-success-600 dark:text-success-400',
    },
    warning: {
      bg: 'bg-warning-100 dark:bg-warning-900/30',
      text: 'text-warning-600 dark:text-warning-400',
    },
    danger: {
      bg: 'bg-danger-100 dark:bg-danger-900/30',
      text: 'text-danger-600 dark:text-danger-400',
    },
    info: {
      bg: 'bg-primary-100 dark:bg-primary-900/30',
      text: 'text-primary-600 dark:text-primary-400',
    },
  };

  const getTrendIcon = () => {
    if (trend === undefined || trend === null) return null;
    if (trend > 0) return <TrendingUp size={14} />;
    if (trend < 0) return <TrendingDown size={14} />;
    return <Minus size={14} />;
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === null) return 'text-secondary-500';
    if (trend > 0) return 'text-danger-600 dark:text-danger-400';
    if (trend < 0) return 'text-success-600 dark:text-success-400';
    return 'text-secondary-500';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-24 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
          <div className="w-10 h-10 bg-secondary-200 dark:bg-secondary-700 rounded-lg animate-pulse" />
        </div>
        <div className="h-8 w-20 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse mb-2" />
        <div className="h-3 w-32 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
      </div>
    );
  }

  const colors = colorClasses[color] || colorClasses.primary;

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-6 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">
          {title}
        </p>
        {Icon && (
          <div className={classNames('w-10 h-10 rounded-lg flex items-center justify-center', colors.bg)}>
            <Icon size={20} className={colors.text} />
          </div>
        )}
      </div>

      <p className="text-3xl font-bold text-secondary-900 dark:text-white">
        {value ?? '—'}
      </p>

      {(trend !== undefined || trendLabel) && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className={classNames('inline-flex items-center gap-1 text-xs font-medium', getTrendColor())}>
            {getTrendIcon()}
            {trend !== undefined && trend !== null && `${Math.abs(trend)}%`}
          </span>
          {trendLabel && (
            <span className="text-xs text-secondary-500 dark:text-secondary-400">
              {trendLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  icon: PropTypes.elementType,
  trend: PropTypes.number,
  trendLabel: PropTypes.string,
  color: PropTypes.oneOf(['primary', 'success', 'warning', 'danger', 'info']),
  loading: PropTypes.bool,
};

export default StatCard;