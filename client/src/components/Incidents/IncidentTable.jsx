import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import Badge from '../Common/Badge';
import Table from '../Common/Table';
import {
  INCIDENT_STATUS_COLORS,
  INCIDENT_STATUS_LABELS,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
} from '../../constants/status';
import { INCIDENT_TYPE_LABELS } from '../../constants/incidentTypes';
import { formatDate } from '../../utils/formatDate';
import { buildRoute } from '../../constants/routes';

const IncidentTable = ({ incidents, loading, sortBy, sortOrder, onSort }) => {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'incidentNumber',
      label: 'Incident #',
      sortable: true,
      render: (value) => (
        <span className="font-mono text-xs text-secondary-600 dark:text-secondary-400">
          {value}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-secondary-900 dark:text-white">{value}</span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => (
        <span className="text-secondary-600 dark:text-secondary-400">
          {INCIDENT_TYPE_LABELS[value] || value}
        </span>
      ),
    },
    {
      key: 'severity',
      label: 'Severity',
      sortable: true,
      render: (value) => (
        <Badge variant={SEVERITY_COLORS[value]} size="sm">
          {SEVERITY_LABELS[value]}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <Badge variant={INCIDENT_STATUS_COLORS[value]} size="sm" dot>
          {INCIDENT_STATUS_LABELS[value]}
        </Badge>
      ),
    },
    {
      key: 'detectedAt',
      label: 'Detected',
      sortable: true,
      render: (value) => (
        <span className="text-xs text-secondary-500">
          {formatDate(value, 'MMM dd, HH:mm')}
        </span>
      ),
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      render: (value) => (
        <span className="text-xs text-secondary-600 dark:text-secondary-400">
          {value?.name || '—'}
        </span>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={incidents}
      loading={loading}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      onRowClick={(row) => navigate(buildRoute.incidentDetails(row._id))}
      emptyMessage="No incidents found. Try adjusting your filters."
    />
  );
};

IncidentTable.propTypes = {
  incidents: PropTypes.array,
  loading: PropTypes.bool,
  sortBy: PropTypes.string,
  sortOrder: PropTypes.string,
  onSort: PropTypes.func,
};

export default IncidentTable;