export const REPORT_TYPES = {
  INCIDENT_SUMMARY: 'incident_summary',
  DAILY_ACTIVITY: 'daily_activity',
  WEEKLY_ANALYTICS: 'weekly_analytics',
  MONTHLY_REPORT: 'monthly_report',
  CUSTOM: 'custom',
};

export const REPORT_TYPE_LABELS = {
  [REPORT_TYPES.INCIDENT_SUMMARY]: 'Incident Summary',
  [REPORT_TYPES.DAILY_ACTIVITY]: 'Daily Activity',
  [REPORT_TYPES.WEEKLY_ANALYTICS]: 'Weekly Analytics',
  [REPORT_TYPES.MONTHLY_REPORT]: 'Monthly Report',
  [REPORT_TYPES.CUSTOM]: 'Custom Report',
};

export const REPORT_TYPE_DESCRIPTIONS = {
  [REPORT_TYPES.INCIDENT_SUMMARY]: 'Summary of all incidents with details and statistics',
  [REPORT_TYPES.DAILY_ACTIVITY]: 'Day-by-day activity report',
  [REPORT_TYPES.WEEKLY_ANALYTICS]: 'Weekly analytics with trends and comparisons',
  [REPORT_TYPES.MONTHLY_REPORT]: 'Comprehensive monthly overview',
  [REPORT_TYPES.CUSTOM]: 'Custom report with your own filters',
};

export const REPORT_FORMATS = {
  PDF: 'pdf',
  EXCEL: 'excel',
  CSV: 'csv',
  JSON: 'json',
};

export const REPORT_FORMAT_LABELS = {
  [REPORT_FORMATS.PDF]: 'PDF Document',
  [REPORT_FORMATS.EXCEL]: 'Excel Spreadsheet',
  [REPORT_FORMATS.CSV]: 'CSV File',
  [REPORT_FORMATS.JSON]: 'JSON Data',
};

export const REPORT_STATUS = {
  PENDING: 'pending',
  GENERATING: 'generating',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

export const REPORT_STATUS_LABELS = {
  [REPORT_STATUS.PENDING]: 'Pending',
  [REPORT_STATUS.GENERATING]: 'Generating',
  [REPORT_STATUS.COMPLETED]: 'Completed',
  [REPORT_STATUS.FAILED]: 'Failed',
};

export const REPORT_STATUS_COLORS = {
  [REPORT_STATUS.PENDING]: 'warning',
  [REPORT_STATUS.GENERATING]: 'info',
  [REPORT_STATUS.COMPLETED]: 'success',
  [REPORT_STATUS.FAILED]: 'danger',
};

export const REPORT_TYPE_OPTIONS = Object.values(REPORT_TYPES).map((value) => ({
  value,
  label: REPORT_TYPE_LABELS[value],
}));

export const REPORT_FORMAT_OPTIONS = Object.values(REPORT_FORMATS).map((value) => ({
  value,
  label: REPORT_FORMAT_LABELS[value],
}));

export const REPORT_STATUS_OPTIONS = Object.values(REPORT_STATUS).map((value) => ({
  value,
  label: REPORT_STATUS_LABELS[value],
}));