import {
  LayoutDashboard,
  AlertTriangle,
  Video,
  Camera,
  FileText,
  Users,
  User,
  Activity,
  Shield,
} from 'lucide-react';
import { ROUTES } from './routes';
import { ROLES } from './roles';

export const SIDEBAR_ITEMS = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: ROUTES.DASHBOARD,
    roles: [ROLES.ADMIN, ROLES.OPERATOR, ROLES.VIEWER],
  },
  {
    label: 'Real-Time Monitor',
    icon: Activity,
    path: ROUTES.REAL_TIME,
    roles: [ROLES.ADMIN, ROLES.OPERATOR],
  },
  {
    label: 'Incidents',
    icon: AlertTriangle,
    path: ROUTES.INCIDENTS,
    roles: [ROLES.ADMIN, ROLES.OPERATOR, ROLES.VIEWER],
  },
  {
    label: 'Alerts',
    icon: Shield,
    path: ROUTES.ALERTS,
    roles: [ROLES.ADMIN, ROLES.OPERATOR, ROLES.VIEWER],
    badgeKey: 'alerts',
  },
  {
    label: 'Cameras',
    icon: Camera,
    path: ROUTES.CAMERAS,
    roles: [ROLES.ADMIN, ROLES.OPERATOR, ROLES.VIEWER],
  },
  {
    label: 'Videos',
    icon: Video,
    path: ROUTES.VIDEOS,
    roles: [ROLES.ADMIN, ROLES.OPERATOR, ROLES.VIEWER],
  },
  {
    label: 'Reports',
    icon: FileText,
    path: ROUTES.REPORTS,
    roles: [ROLES.ADMIN, ROLES.OPERATOR, ROLES.VIEWER],
  },
  {
    label: 'Users',
    icon: Users,
    path: ROUTES.USERS,
    roles: [ROLES.ADMIN],
  },
];

export const SIDEBAR_SECTIONS = [
  {
    title: 'Overview',
    items: ['Dashboard', 'Real-Time Monitor'],
  },
  {
    title: 'Security',
    items: ['Incidents', 'Alerts', 'Cameras'],
  },
  {
    title: 'Analysis',
    items: ['Videos', 'Reports'],
  },
  {
    title: 'Administration',
    items: ['Users'],
  },
];