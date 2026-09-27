import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';

// Layouts
import AuthLayout from '../components/Layout/AuthLayout';
import MainLayout from '../components/Layout/MainLayout';

// Route guards
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Auth pages
import Login from '../Pages/Auth/Login';
import Register from '../Pages/Auth/Register';
import ForgotPassword from '../Pages/Auth/ForgotPassword';

import Dashboard from '../Pages/Dashboard/Dashboard';
import IncidentList from '../Pages/Incidents/IncidentList';
import CreateIncident from '../Pages/Incidents/CreateIncident';
import IncidentDetails from '../Pages/Incidents/IncidentDetails';
import AlertsPage from '../Pages/Alerts/AlertList';
import AlertDetailsPage from '../Pages/Alerts/AlertDetails';
import VideoLibrary from '../Pages/Videos/VideoLibrary';
import VideoDetails from '../Pages/Videos/VideoDetails';
import ReportList from '../Pages/Reports/ReportList';
import GenerateReport from '../Pages/Reports/GenerateReport';
import ReportDetails from '../Pages/Reports/ReportDetails';
import UserList from '../Pages/Users/UserList';
import AddUser from '../Pages/Users/AddUser';
import UserDetails from '../Pages/Users/UserDetails';
import Profile from '../Pages/Profile/Profile';
import Settings from '../Pages/Profile/Settings';
import CameraList from '../Pages/Cameras/CameraList';
import AddCamera from '../Pages/Cameras/AddCamera';
import CameraDetails from '../Pages/Cameras/CameraDetails';
import RealTimeMonitor from '../Pages/Dashboard/RealTimeMonitor';
import AIDetectionTest from '../Pages/Dashboard/AIDetectionTest';



const Placeholder = ({ title }) => (
  <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">{title}</h1>
      <p className="text-secondary-500 dark:text-secondary-400">Coming in the next steps</p>
    </div>
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />

      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
      </Route>

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route path={ROUTES.REAL_TIME} element={<RealTimeMonitor />} />
          <Route path={ROUTES.INCIDENTS} element={<IncidentList />} />
          <Route path={ROUTES.CREATE_INCIDENT} element={<CreateIncident />} />
          <Route path={ROUTES.INCIDENT_DETAILS} element={<IncidentDetails />} />
          <Route path={ROUTES.ALERTS} element={<AlertsPage />} />
          <Route path={ROUTES.ALERT_DETAILS} element={<AlertDetailsPage />} />
          <Route path={ROUTES.CAMERAS} element={<CameraList />} />
          <Route path={ROUTES.ADD_CAMERA} element={<AddCamera />} />
          <Route path={ROUTES.CAMERA_DETAILS} element={<CameraDetails />} />
          <Route path={ROUTES.VIDEOS} element={<VideoLibrary />} />
          <Route path={ROUTES.VIDEO_DETAILS} element={<VideoDetails />} />
          <Route path={ROUTES.REPORTS} element={<ReportList />} />
          <Route path={ROUTES.GENERATE_REPORT} element={<GenerateReport />} />
          <Route path={ROUTES.REPORT_DETAILS} element={<ReportDetails />} />
          <Route path={ROUTES.PROFILE} element={<Profile />} />
          <Route path={ROUTES.SETTINGS} element={<Settings />} />
          <Route path="/dashboard/ai-test" element={<AIDetectionTest />} />
          
          {/* Admin only */}
          <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
            <Route path={ROUTES.USERS} element={<UserList />} />
            <Route path={ROUTES.ADD_USER} element={<AddUser />} />
            <Route path={ROUTES.USER_DETAILS} element={<UserDetails />} />
            <Route path={ROUTES.SYSTEM_HEALTH} element={<Placeholder title="System Health" />} />
          </Route>
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<Placeholder title="404 - Not Found" />} />
    </Routes>
  );
};

export default AppRoutes;