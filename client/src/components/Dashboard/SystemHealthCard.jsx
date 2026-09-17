import PropTypes from 'prop-types';
import { Cpu, HardDrive, Users, Activity } from 'lucide-react';
import Card from '../Common/Card';
import Skeleton from '../Common/Skeleton';
import classNames from 'classnames';

const SystemHealthCard = ({ health, loading = false }) => {
  if (loading) {
    return (
      <Card title="System Health">
        <div className="space-y-4">
          <Skeleton count={4} variant="rect" height={40} />
        </div>
      </Card>
    );
  }

  if (!health) return null;

  const { system, users, data, performance } = health;

  const metrics = [
    {
      label: 'System Status',
      value: system?.status === 'healthy' ? 'Healthy' : 'Degraded',
      icon: Activity,
      color: system?.status === 'healthy' ? 'success' : 'warning',
    },
    {
      label: 'Active Users',
      value: `${users?.active || 0} / ${users?.total || 0}`,
      icon: Users,
      color: 'primary',
    },
    {
      label: 'Storage Used',
      value: `${data?.storageUsedGB || 0} GB`,
      icon: HardDrive,
      color: 'info',
    },
    {
      label: 'Response Time',
      value: performance?.responseTime || '—',
      icon: Cpu,
      color: 'success',
    },
  ];

  const colorClasses = {
    success: 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400',
    warning: 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400',
    danger: 'bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400',
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    info: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
  };

  return (
    <Card title="System Health" subtitle="Real-time system metrics">
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-700/50"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className={classNames('p-1.5 rounded', colorClasses[metric.color])}>
                  <Icon size={14} />
                </div>
                <span className="text-xs text-secondary-500 dark:text-secondary-400">
                  {metric.label}
                </span>
              </div>
              <p className="text-lg font-bold text-secondary-900 dark:text-white">
                {metric.value}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

SystemHealthCard.propTypes = {
  health: PropTypes.object,
  loading: PropTypes.bool,
};

export default SystemHealthCard;