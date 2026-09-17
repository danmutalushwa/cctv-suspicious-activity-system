import { format, formatDistance, formatRelative, isValid, parseISO } from 'date-fns';

export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return 'N/A';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return 'Invalid date';
  return format(parsed, formatStr);
};

export const formatDateTime = (date) => {
  return formatDate(date, 'MMM dd, yyyy HH:mm');
};

export const formatTime = (date) => {
  return formatDate(date, 'HH:mm:ss');
};

export const formatRelativeTime = (date) => {
  if (!date) return 'N/A';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return 'Invalid date';
  return formatDistance(parsed, new Date(), { addSuffix: true });
};

export const formatRelativeCalendar = (date) => {
  if (!date) return 'N/A';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return 'Invalid date';
  return formatRelative(parsed, new Date());
};

export const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) return '0s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
};