import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  Shield,
} from 'lucide-react';
import classNames from 'classnames';
import { useAuth } from '../../hooks/useAuth';
import { notificationService } from '../../services/notification.service';
import { ROUTES } from '../../constants/routes';
import { ROLE_LABELS } from '../../constants/roles';

const UserDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold text-sm">
          {getInitials(user?.name)}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-secondary-900 dark:text-white leading-tight">
            {user?.name}
          </p>
          <p className="text-xs text-secondary-500 dark:text-secondary-400">
            {ROLE_LABELS[user?.role]}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={classNames(
            'text-secondary-400 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-secondary-800 rounded-lg shadow-dropdown border border-secondary-200 dark:border-secondary-700 overflow-hidden z-50 animate-fade-in">
          {/* Header */}
          <div className="p-4 border-b border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-900/50">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold">
                {getInitials(user?.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30">
              <Shield size={11} className="text-primary-600 dark:text-primary-400" />
              <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                {ROLE_LABELS[user?.role]}
              </span>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-2">
            <Link
              to={ROUTES.PROFILE}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
            >
              <User size={16} />
              <span>My Profile</span>
            </Link>
            <Link
              to={ROUTES.SETTINGS}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
            >
              <Settings size={16} />
              <span>Settings</span>
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-secondary-200 dark:border-secondary-700 py-2">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;