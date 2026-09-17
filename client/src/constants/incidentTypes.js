export const INCIDENT_TYPES = {
  INTRUSION: 'intrusion',
  LOITERING: 'loitering',
  TRESPASSING: 'trespassing',
  VIOLENCE: 'violence',
  ABANDONED_OBJECT: 'abandoned_object',
  THEFT: 'theft',
  VANDALISM: 'vandalism',
  SUSPICIOUS_BEHAVIOR: 'suspicious_behavior',
  OTHER: 'other',
};

export const INCIDENT_TYPE_LABELS = {
  [INCIDENT_TYPES.INTRUSION]: 'Intrusion',
  [INCIDENT_TYPES.LOITERING]: 'Loitering',
  [INCIDENT_TYPES.TRESPASSING]: 'Trespassing',
  [INCIDENT_TYPES.VIOLENCE]: 'Violence',
  [INCIDENT_TYPES.ABANDONED_OBJECT]: 'Abandoned Object',
  [INCIDENT_TYPES.THEFT]: 'Theft',
  [INCIDENT_TYPES.VANDALISM]: 'Vandalism',
  [INCIDENT_TYPES.SUSPICIOUS_BEHAVIOR]: 'Suspicious Behavior',
  [INCIDENT_TYPES.OTHER]: 'Other',
};

export const INCIDENT_TYPE_COLORS = {
  [INCIDENT_TYPES.INTRUSION]: 'danger',
  [INCIDENT_TYPES.LOITERING]: 'warning',
  [INCIDENT_TYPES.TRESPASSING]: 'danger',
  [INCIDENT_TYPES.VIOLENCE]: 'danger',
  [INCIDENT_TYPES.ABANDONED_OBJECT]: 'warning',
  [INCIDENT_TYPES.THEFT]: 'danger',
  [INCIDENT_TYPES.VANDALISM]: 'warning',
  [INCIDENT_TYPES.SUSPICIOUS_BEHAVIOR]: 'warning',
  [INCIDENT_TYPES.OTHER]: 'info',
};

export const INCIDENT_TYPE_OPTIONS = Object.values(INCIDENT_TYPES).map((value) => ({
  value,
  label: INCIDENT_TYPE_LABELS[value],
}));