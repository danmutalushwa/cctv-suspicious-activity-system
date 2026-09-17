import { Navigate, Outlet } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../constants/routes';

const RoleRoute = ({ allowedRoles = [] }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
};

RoleRoute.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
};

export default RoleRoute;