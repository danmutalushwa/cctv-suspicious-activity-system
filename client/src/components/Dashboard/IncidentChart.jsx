import PropTypes from 'prop-types';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import Card from '../Common/Card';
import EmptyState from '../Common/EmptyState';
import Skeleton from '../Common/Skeleton';
import { CHART_COLORS } from '../../constants/colors';
import { INCIDENT_TYPE_LABELS } from '../../constants/incidentTypes';
import { SEVERITY_LABELS } from '../../constants/status';

const IncidentChart = ({
  data = [],
  type = 'pie',
  title = 'Incidents by Type',
  dataKey = 'count',
  nameKey = '_id',
  loading = false,
  labelMap = null,
}) => {
  if (loading) {
    return (
      <Card title={title}>
        <Skeleton variant="rect" height={300} />
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card title={title}>
        <EmptyState title="No data" description="No incident data available yet." />
      </Card>
    );
  }

  const getLabel = (value) => {
    if (labelMap && labelMap[value]) return labelMap[value];
    if (INCIDENT_TYPE_LABELS[value]) return INCIDENT_TYPE_LABELS[value];
    if (SEVERITY_LABELS[value]) return SEVERITY_LABELS[value];
    return value;
  };

  const chartData = data.map((item) => ({
    name: getLabel(item[nameKey]),
    value: item[dataKey],
    raw: item,
  }));

  if (type === 'bar') {
    return (
      <Card title={title}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#64748b' }}
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
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    );
  }

  return (
    <Card title={title}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={90}
            innerRadius={50}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};

IncidentChart.propTypes = {
  data: PropTypes.array,
  type: PropTypes.oneOf(['pie', 'bar']),
  title: PropTypes.string,
  dataKey: PropTypes.string,
  nameKey: PropTypes.string,
  loading: PropTypes.bool,
  labelMap: PropTypes.object,
};

export default IncidentChart;