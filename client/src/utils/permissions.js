import { ROLE_PERMISSIONS } from '../constants/roles';

export const hasPermission = (role, permission) => {
  if (!role || !permission) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

export const hasAnyPermission = (role, permissions = []) => {
  return permissions.some((perm) => hasPermission(role, perm));
};

export const hasAllPermissions = (role, permissions = []) => {
  return permissions.every((perm) => hasPermission(role, perm));
};

export const isAdmin = (role) => role === 'admin';
export const isOperator = (role) => role === 'operator';
export const isViewer = (role) => role === 'viewer';

export const canManageUsers = (role) => hasPermission(role, 'users:create');
export const canManageCameras = (role) => hasPermission(role, 'cameras:create');
export const canDeleteIncidents = (role) => hasPermission(role, 'incidents:delete');
export const canViewSystemHealth = (role) => hasPermission(role, 'system:health');