export const INCIDENT_STATUS = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  CONFIRMED: 'confirmed',
  FALSE_ALARM: 'false_alarm',
  RESOLVED: 'resolved',
};

export const INCIDENT_STATUS_LABELS = {
  [INCIDENT_STATUS.PENDING]: 'Pending',
  [INCIDENT_STATUS.UNDER_REVIEW]: 'Under Review',
  [INCIDENT_STATUS.CONFIRMED]: 'Confirmed',
  [INCIDENT_STATUS.FALSE_ALARM]: 'False Alarm',
  [INCIDENT_STATUS.RESOLVED]: 'Resolved',
};

export const INCIDENT_STATUS_COLORS = {
  [INCIDENT_STATUS.PENDING]: 'warning',
  [INCIDENT_STATUS.UNDER_REVIEW]: 'info',
  [INCIDENT_STATUS.CONFIRMED]: 'danger',
  [INCIDENT_STATUS.FALSE_ALARM]: 'secondary',
  [INCIDENT_STATUS.RESOLVED]: 'success',
};

export const INCIDENT_STATUS_OPTIONS = Object.values(INCIDENT_STATUS).map((value) => ({
  value,
  label: INCIDENT_STATUS_LABELS[value],
}));

export const SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const SEVERITY_LABELS = {
  [SEVERITY.LOW]: 'Low',
  [SEVERITY.MEDIUM]: 'Medium',
  [SEVERITY.HIGH]: 'High',
  [SEVERITY.CRITICAL]: 'Critical',
};

export const SEVERITY_COLORS = {
  [SEVERITY.LOW]: 'success',
  [SEVERITY.MEDIUM]: 'info',
  [SEVERITY.HIGH]: 'warning',
  [SEVERITY.CRITICAL]: 'danger',
};

export const SEVERITY_OPTIONS = Object.values(SEVERITY).map((value) => ({
  value,
  label: SEVERITY_LABELS[value],
}));