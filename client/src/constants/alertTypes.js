export const ALERT_TYPES = {
  EMAIL: 'email',
  SMS: 'sms',
  IN_APP: 'in_app',
  PUSH: 'push',
  SOCKET: 'socket',
};

export const ALERT_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const ALERT_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
};

export const ALERT_PRIORITY_LABELS = {
  [ALERT_PRIORITY.LOW]: 'Low',
  [ALERT_PRIORITY.MEDIUM]: 'Medium',
  [ALERT_PRIORITY.HIGH]: 'High',
  [ALERT_PRIORITY.CRITICAL]: 'Critical',
};

export const ALERT_PRIORITY_COLORS = {
  [ALERT_PRIORITY.LOW]: 'success',
  [ALERT_PRIORITY.MEDIUM]: 'info',
  [ALERT_PRIORITY.HIGH]: 'warning',
  [ALERT_PRIORITY.CRITICAL]: 'danger',
};

export const ALERT_PRIORITY_OPTIONS = Object.values(ALERT_PRIORITY).map((value) => ({
  value,
  label: ALERT_PRIORITY_LABELS[value],
}));