import PropTypes from 'prop-types';
import { X, Filter } from 'lucide-react';
import SearchBar from '../Common/SearchBar';
import Select from '../Common/Select';
import Button from '../Common/Button';
import { INCIDENT_TYPE_OPTIONS } from '../../constants/incidentTypes';
import { INCIDENT_STATUS_OPTIONS, SEVERITY_OPTIONS } from '../../constants/status';

const IncidentFilters = ({ filters, onFilterChange, onReset, showReset = false }) => {
  const handleChange = (name, value) => {
    onFilterChange({ ...filters, [name]: value });
  };

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-secondary-700 dark:text-secondary-300">
          <Filter size={16} />
          Filters
        </div>
        {showReset && (
          <Button variant="ghost" size="sm" icon={X} onClick={onReset}>
            Reset
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SearchBar
          value={filters.search || ''}
          onChange={(value) => handleChange('search', value)}
          placeholder="Search incidents..."
        />

        <Select
          name="status"
          value={filters.status || ''}
          onChange={(e) => handleChange('status', e.target.value)}
          options={INCIDENT_STATUS_OPTIONS}
          placeholder="All Statuses"
        />

        <Select
          name="type"
          value={filters.type || ''}
          onChange={(e) => handleChange('type', e.target.value)}
          options={INCIDENT_TYPE_OPTIONS}
          placeholder="All Types"
        />

        <Select
          name="severity"
          value={filters.severity || ''}
          onChange={(e) => handleChange('severity', e.target.value)}
          options={SEVERITY_OPTIONS}
          placeholder="All Severities"
        />
      </div>
    </div>
  );
};

IncidentFilters.propTypes = {
  filters: PropTypes.object.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onReset: PropTypes.func,
  showReset: PropTypes.bool,
};

export default IncidentFilters;