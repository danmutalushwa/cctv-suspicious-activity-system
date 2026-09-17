import { NavLink, useLocation } from 'react-router-dom';
import { X, Shield } from 'lucide-react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { SIDEBAR_ITEMS } from '../../constants/layout';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();

  // Filter items by user role
  const visibleItems = SIDEBAR_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  const getBadgeCount = (badgeKey) => {
    if (badgeKey === 'alerts') return unreadCount;
    return 0;
  };

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-secondary-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={classNames(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-secondary-800 border-r border-secondary-200 dark:border-secondary-700 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo/Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <h1 className="text-sm font-bold text-secondary-900 dark:text-white">
                Intelligent CCTV
              </h1>
              <p className="text-xs text-secondary-500">Security System</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-700 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
          <ul className="space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const badge = getBadgeCount(item.badgeKey);
              const active = isActive(item.path);

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={classNames(
                      'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700'
                    )}
                  >
                    <Icon
                      size={18}
                      className={classNames(
                        'flex-shrink-0',
                        active
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-secondary-500 dark:text-secondary-400 group-hover:text-secondary-700 dark:group-hover:text-secondary-200'
                      )}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {badge > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full bg-danger-500 text-white">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-secondary-200 dark:border-secondary-700">
          <div className="text-xs text-secondary-500 dark:text-secondary-400 text-center">
            <p>v1.0.0</p>
          </div>
        </div>
      </aside>
    </>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Sidebar;