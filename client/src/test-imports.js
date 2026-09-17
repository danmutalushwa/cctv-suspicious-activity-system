// Test constants
import { ROLES, INCIDENT_TYPES, ALERT_PRIORITY, ROUTES, SEVERITY } from './constants';
console.log('Constants:', { ROLES, INCIDENT_TYPES, ALERT_PRIORITY, ROUTES, SEVERITY });

// Test utils
import { formatDate, formatFileSize, hasPermission } from './utils';
console.log('Utils:', { formatDate, formatFileSize, hasPermission });

// Test API
import { authAPI, incidentsAPI, alertsAPI } from './api';
console.log('APIs:', { authAPI, incidentsAPI, alertsAPI });

// Test hooks
import { useAuth, useSocket, usePagination } from './hooks';
console.log('Hooks:', { useAuth, useSocket, usePagination });