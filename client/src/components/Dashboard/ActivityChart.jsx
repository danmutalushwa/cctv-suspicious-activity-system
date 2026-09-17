import PropTypes from 'prop-types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import Card from '../Common/Card';
import EmptyState from '../Common/EmptyState';
import Skeleton from '../Common/Skeleton';
import { SEVERITY_COLORS } from '../../constants/status';

const ActivityChart = ({ data = [], loading = false, days = 7 }) => {
  if (loading) {
    return (
      <Card title="Activity Overview">
        <Skeleton variant="rect" height={300} />
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card title="Activity Overview">
        <EmptyState
          title="No activity data"
          description={`No incidents found in the last ${days} days.`}
        />
      </Card>
    );
  }

  return (
    <Card title="Activity Overview" subtitle={`Last ${days} days`}>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Area
            type="monotone"
            dataKey="low"
            stackId="1"
            stroke="#22c55e"
            fill="url(#colorLow)"
            name="Low"
          />
          <Area
            type="monotone"
            dataKey="medium"
            stackId="1"
            stroke="#3b82f6"
            fill="url(#colorMedium)"
            name="Medium"
          />
          <Area
            type="monotone"
            dataKey="high"
            stackId="1"
            stroke="#f59e0b"
            fill="url(#colorHigh)"
            name="High"
          />
          <Area
            type="monotone"
            dataKey="critical"
            stackId="1"
            stroke="#ef4444"
            fill="url(#colorCritical)"
            name="Critical"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};

ActivityChart.propTypes = {
  data: PropTypes.array,
  loading: PropTypes.bool,
  days: PropTypes.number,
};

export default ActivityChart;