import { useState } from 'react';
import PropTypes from 'prop-types';
import { FileText, Calendar, Filter } from 'lucide-react';
import Card from '../Common/Card';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Select from '../Common/Select';
import Checkbox from '../Common/Checkbox';
import {
  REPORT_TYPE_OPTIONS,
  REPORT_FORMAT_OPTIONS,
  REPORT_TYPES,
} from '../../constants/reportTypes';
import { INCIDENT_TYPE_OPTIONS } from '../../constants/incidentTypes';
import { SEVERITY_OPTIONS, INCIDENT_STATUS_OPTIONS } from '../../constants/status';

const GenerateReportForm = ({ onSubmit, loading = false }) => {
  const today = new Date().toISOString().split('T')[0];
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: REPORT_TYPES.INCIDENT_SUMMARY,
    format: 'pdf',
    startDate: lastWeek,
    endDate: today,
    includeDetails: true,
    includeCharts: true,
    filters: {
      incidentTypes: [],
      severity: [],
      status: [],
    },
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleArrayFilter = (field, value) => {
    setFormData((prev) => {
      const current = prev.filters[field] || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return {
        ...prev,
        filters: { ...prev.filters, [field]: updated },
      };
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    const diffDays =
      (new Date(formData.endDate) - new Date(formData.startDate)) /
      (1000 * 60 * 60 * 24);
    if (diffDays > 90) {
      newErrors.endDate = 'Date range cannot exceed 90 days';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      type: formData.type,
      format: formData.format,
      parameters: {
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate + 'T23:59:59').toISOString(),
        includeDetails: formData.includeDetails,
        includeCharts: formData.includeCharts,
        grouping: 'day',
        filters: {
          incidentTypes: formData.filters.incidentTypes,
          severity: formData.filters.severity,
          status: formData.filters.status,
        },
      },
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card title="Report Information">
        <div className="space-y-4">
          <Input
            label="Report Title"
            name="title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            error={errors.title}
            touched={!!errors.title}
            placeholder="e.g., Weekly Incident Report"
            required
            maxLength={200}
          />

          <Input
            label="Description"
            name="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Optional description of this report"
            maxLength={1000}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Report Type"
              name="type"
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              options={REPORT_TYPE_OPTIONS}
              required
            />

            <Select
              label="Format"
              name="format"
              value={formData.format}
              onChange={(e) => handleChange('format', e.target.value)}
              options={REPORT_FORMAT_OPTIONS}
              required
            />
          </div>
        </div>
      </Card>

      {/* Date Range */}
      <Card title="Date Range">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
            error={errors.startDate}
            touched={!!errors.startDate}
            icon={Calendar}
            required
          />

          <Input
            label="End Date"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
            error={errors.endDate}
            touched={!!errors.endDate}
            icon={Calendar}
            required
            max={today}
          />
        </div>
        <p className="mt-3 text-xs text-secondary-500">
          Maximum date range: 90 days
        </p>
      </Card>

      {/* Filters */}
      <Card
        title="Filters"
        subtitle="Narrow down which data to include (optional)"
      >
        <div className="space-y-6">
          {/* Incident Types */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
              Incident Types
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {INCIDENT_TYPE_OPTIONS.map((option) => (
                <Checkbox
                  key={option.value}
                  name={`type-${option.value}`}
                  label={option.label}
                  checked={formData.filters.incidentTypes.includes(option.value)}
                  onChange={() => handleArrayFilter('incidentTypes', option.value)}
                />
              ))}
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
              Severity
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SEVERITY_OPTIONS.map((option) => (
                <Checkbox
                  key={option.value}
                  name={`severity-${option.value}`}
                  label={option.label}
                  checked={formData.filters.severity.includes(option.value)}
                  onChange={() => handleArrayFilter('severity', option.value)}
                />
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
              Status
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {INCIDENT_STATUS_OPTIONS.map((option) => (
                <Checkbox
                  key={option.value}
                  name={`status-${option.value}`}
                  label={option.label}
                  checked={formData.filters.status.includes(option.value)}
                  onChange={() => handleArrayFilter('status', option.value)}
                />
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700">
            <div className="space-y-3">
              <Checkbox
                name="includeDetails"
                label="Include detailed incident list"
                checked={formData.includeDetails}
                onChange={(e) => handleChange('includeDetails', e.target.checked)}
              />
              <Checkbox
                name="includeCharts"
                label="Include charts and visualizations"
                checked={formData.includeCharts}
                onChange={(e) => handleChange('includeCharts', e.target.checked)}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button type="submit" variant="primary" icon={FileText} loading={loading}>
          Generate Report
        </Button>
      </div>
    </form>
  );
};

GenerateReportForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default GenerateReportForm;