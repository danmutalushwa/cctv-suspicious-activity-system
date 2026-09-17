export const ROLES = {
  ADMIN: 'admin',
  OPERATOR: 'operator',
  VIEWER: 'viewer',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.OPERATOR]: 'Operator',
  [ROLES.VIEWER]: 'Viewer',
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    'users:create', 'users:read', 'users:update', 'users:delete',
    'incidents:create', 'incidents:read', 'incidents:update', 'incidents:delete',
    'alerts:create', 'alerts:read', 'alerts:update', 'alerts:delete',
    'videos:create', 'videos:read', 'videos:update', 'videos:delete',
    'reports:create', 'reports:read', 'reports:delete',
    'cameras:create', 'cameras:read', 'cameras:update', 'cameras:delete',
    'dashboard:read', 'system:health',
  ],
  [ROLES.OPERATOR]: [
    'incidents:create', 'incidents:read', 'incidents:update',
    'alerts:create', 'alerts:read', 'alerts:update',
    'videos:create', 'videos:read', 'videos:update',
    'reports:create', 'reports:read',
    'cameras:read',
    'dashboard:read',
  ],
  [ROLES.VIEWER]: [
    'incidents:read',
    'alerts:read',
    'videos:read',
    'reports:read',
    'dashboard:read',
  ],
};