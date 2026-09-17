import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Inbox, Volume2, VolumeX, Settings } from 'lucide-react';
import classNames from 'classnames';
import { useNotifications } from '../../hooks/useNotifications';
import { formatRelativeTime } from '../../utils/formatDate';
import { buildRoute, ROUTES } from '../../constants/routes';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loading,
    preferences,
    updatePreferences,
  } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPriorityColor = (priority) => {
    const colorMap = {
      low: 'bg-success-500',
      medium: 'bg-primary-500',
      high: 'bg-warning-500',
      critical: 'bg-danger-500',
    };
    return colorMap[priority] || 'bg-secondary-500';
  };

  const recentNotifications = notifications.slice(0, 8);

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    setIsOpen(false);
    navigate(buildRoute.alertDetails(notification._id));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-danger-500 text-white ring-2 ring-white dark:ring-secondary-800">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-secondary-800 rounded-lg shadow-dropdown border border-secondary-200 dark:border-secondary-700 overflow-hidden z-50 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-secondary-200 dark:border-secondary-700">
            <div>
              <h3 className="text-sm font-semibold text-secondary-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <p className="text-xs text-secondary-500 dark:text-secondary-400">
                  {unreadCount} unread
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => updatePreferences({ sound: !preferences.sound })}
                className="p-1.5 rounded text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                title={preferences.sound ? 'Mute sounds' : 'Enable sounds'}
              >
                {preferences.sound ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate(ROUTES.SETTINGS);
                }}
                className="p-1.5 rounded text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                title="Notification settings"
              >
                <Settings size={14} />
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="ml-1 flex items-center gap-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 disabled:opacity-50"
                >
                  <CheckCheck size={14} />
                  All read
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto scrollbar-thin">
            {recentNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-secondary-100 dark:bg-secondary-700 flex items-center justify-center mb-3">
                  <Inbox size={20} className="text-secondary-400" />
                </div>
                <p className="text-sm font-medium text-secondary-900 dark:text-white">
                  No notifications
                </p>
                <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                  You&apos;re all caught up!
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-secondary-100 dark:divide-secondary-700">
                {recentNotifications.map((notification) => {
                  const isRead =
                    notification.recipients?.[0]?.status === 'read';
                  return (
                    <li
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification)}
                      className={classNames(
                        'p-4 hover:bg-secondary-50 dark:hover:bg-secondary-700/50 cursor-pointer transition-colors',
                        !isRead && 'bg-primary-50/50 dark:bg-primary-900/10'
                      )}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 pt-1">
                          <div
                            className={classNames(
                              'w-2 h-2 rounded-full',
                              getPriorityColor(notification.priority)
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-secondary-900 dark:text-white line-clamp-1">
                            {notification.title}
                          </p>
                          <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>
                        {!isRead && (
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 rounded-full bg-primary-500" />
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-secondary-200 dark:border-secondary-700 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate(ROUTES.ALERTS);
                }}
                className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700"
              >
                View all alerts
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;