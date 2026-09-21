import {
  createContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';

import { alertsAPI } from '../api/alerts';
import { socketService } from '../services/socket';
import { notificationService } from '../services/notification.service';
import { soundService } from '../services/sound.service';
import { browserNotificationService } from '../services/browserNotification.service';
import { storage } from '../utils/storage';
import { useAuth } from '../hooks/useAuth';

export const NotificationContext = createContext(null);

const PREFERENCES_KEY = 'cctv_notification_preferences';

const defaultPreferences = {
  toast: true,
  sound: true,
  browser: true,
  minPriority: 'low',
};

const PRIORITY_LEVELS = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export const NotificationProvider = ({ children }) => {
  // =========================================================
  // STATE
  // =========================================================

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = storage.getPreferences?.();

      if (saved) {
        return {
          ...defaultPreferences,
          ...saved,
        };
      }
    } catch (error) {
      console.error(
        'Failed to load notification preferences:',
        error
      );
    }

    return defaultPreferences;
  });

  const { isAuthenticated } = useAuth();

  const seenAlertIds = useRef(new Set());

  // =========================================================
  // PERSIST PREFERENCES
  // =========================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        PREFERENCES_KEY,
        JSON.stringify(preferences)
      );
    } catch (error) {
      console.error(
        'Failed to save notification preferences:',
        error
      );
    }

    soundService.setEnabled(preferences.sound);
  }, [preferences]);

  // =========================================================
  // FETCH UNREAD COUNT
  // =========================================================

  /*
   * The backend statistics endpoint returns:
   *
   * {
   *   success: true,
   *   data: {
   *     total,
   *     unreadCount,
   *     byPriority,
   *     byType,
   *     recent
   *   }
   * }
   *
   * alertsAPI.getStatistics() returns Axios response.data.
   *
   * Therefore:
   *
   * response.data.unreadCount
   *
   * is the correct path.
   */

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      const response = await alertsAPI.getStatistics();

      const count = response.data?.unreadCount ?? 0;

      setUnreadCount(count);
    } catch (error) {
      console.error(
        'Failed to fetch unread count:',
        error
      );
    }
  }, [isAuthenticated]);

  // =========================================================
  // INITIAL UNREAD COUNT
  // =========================================================

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
    } else {
      setUnreadCount(0);
      setNotifications([]);
    }
  }, [isAuthenticated, fetchUnreadCount]);

  // =========================================================
  // HANDLE NEW ALERT
  // =========================================================

  const handleNewAlert = useCallback(
    (alert) => {
      if (!alert?._id) {
        return;
      }

      // -----------------------------------------------------
      // Prevent duplicate socket notifications
      // -----------------------------------------------------

      if (seenAlertIds.current.has(alert._id)) {
        return;
      }

      seenAlertIds.current.add(alert._id);

      // Prevent the Set from growing forever
      if (seenAlertIds.current.size > 200) {
        const ids = Array.from(
          seenAlertIds.current
        );

        seenAlertIds.current = new Set(
          ids.slice(-100)
        );
      }

      // -----------------------------------------------------
      // Add notification to local list
      // -----------------------------------------------------

      setNotifications((prev) => {
        const alreadyExists = prev.some(
          (notification) =>
            notification._id === alert._id
        );

        if (alreadyExists) {
          return prev;
        }

        return [alert, ...prev].slice(0, 50);
      });

      // -----------------------------------------------------
      // Increase unread count
      // -----------------------------------------------------

      setUnreadCount((prev) => prev + 1);

      // -----------------------------------------------------
      // Priority check
      // -----------------------------------------------------

      const alertPriorityLevel =
        PRIORITY_LEVELS[alert.priority] || 1;

      const minPriorityLevel =
        PRIORITY_LEVELS[
          preferences.minPriority
        ] || 1;

      const shouldNotify =
        alertPriorityLevel >= minPriorityLevel;

      if (!shouldNotify) {
        return;
      }

      // -----------------------------------------------------
      // Toast notification
      // -----------------------------------------------------

      if (preferences.toast) {
        const toastFn =
          alert.priority === 'critical' ||
          alert.priority === 'high'
            ? notificationService.alert
            : notificationService.info;

        toastFn(`🔔 ${alert.title}`, {
          toastId: alert._id,
          autoClose:
            alert.priority === 'critical'
              ? 15000
              : 8000,
        });
      }

      // -----------------------------------------------------
      // Sound notification
      // -----------------------------------------------------

      if (preferences.sound) {
        soundService.playForPriority(
          alert.priority
        );
      }

      // -----------------------------------------------------
      // Browser notification
      // -----------------------------------------------------

      if (preferences.browser) {
        browserNotificationService.showAlert(
          alert
        );
      }
    },
    [preferences]
  );

  // =========================================================
  // SOCKET EVENTS
  // =========================================================

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const socket = socketService.getSocket();

    if (!socket) {
      return;
    }

    // -------------------------------------------------------
    // New alert
    // -------------------------------------------------------

    const onNewAlert = (data) => {
      const alert = data?.alert;

      if (alert) {
        handleNewAlert(alert);
      }
    };

    // -------------------------------------------------------
    // Alert acknowledged
    // -------------------------------------------------------

    const onAlertAcknowledged = () => {
      fetchUnreadCount();
    };

    socket.on('new_alert', onNewAlert);
    socket.on(
      'alert_acknowledged',
      onAlertAcknowledged
    );

    return () => {
      socket.off(
        'new_alert',
        onNewAlert
      );

      socket.off(
        'alert_acknowledged',
        onAlertAcknowledged
      );
    };
  }, [
    isAuthenticated,
    handleNewAlert,
    fetchUnreadCount,
  ]);

  // =========================================================
  // BROWSER NOTIFICATION PERMISSION
  // =========================================================

  useEffect(() => {
    if (
      isAuthenticated &&
      preferences.browser &&
      browserNotificationService.getPermission() ===
        'default'
    ) {
      browserNotificationService.requestPermission();
    }
  }, [
    isAuthenticated,
    preferences.browser,
  ]);

  // =========================================================
  // INITIALIZE AUDIO
  // =========================================================

  useEffect(() => {
    const initAudio = () => {
      soundService.initialize();

      document.removeEventListener(
        'click',
        initAudio
      );
    };

    document.addEventListener(
      'click',
      initAudio
    );

    return () => {
      document.removeEventListener(
        'click',
        initAudio
      );
    };
  }, []);

  // =========================================================
  // MARK ONE ALERT AS READ
  // =========================================================

  const markAsRead = useCallback(
    async (alertId) => {
      if (!alertId) {
        return;
      }

      try {
        /*
         * Update backend first.
         */
        await alertsAPI.markAsRead(alertId);

        /*
         * Update local notification state.
         */
        setNotifications((prev) =>
          prev.map((notification) =>
            notification._id === alertId
              ? {
                  ...notification,
                  recipients:
                    notification.recipients?.map(
                      (recipient) => ({
                        ...recipient,
                        status: 'read',
                      })
                    ),
                }
              : notification
          )
        );

        /*
         * Fetch the authoritative unread count
         * from the backend.
         *
         * This prevents the Sidebar/Navbar badge
         * from becoming out of sync.
         */
        await fetchUnreadCount();
      } catch (error) {
        console.error(
          'Failed to mark alert as read:',
          error
        );
      }
    },
    [fetchUnreadCount]
  );

  // =========================================================
  // MARK ALL ALERTS AS READ
  // =========================================================

  const markAllAsRead = useCallback(
    async () => {
      try {
        setLoading(true);

        /*
         * Update backend.
         */
        await alertsAPI.markAllAsRead();

        /*
         * Immediately update local state.
         */
        setUnreadCount(0);

        setNotifications((prev) =>
          prev.map((notification) => ({
            ...notification,
            recipients:
              notification.recipients?.map(
                (recipient) => ({
                  ...recipient,
                  status: 'read',
                })
              ),
          }))
        );

        /*
         * Confirm the actual backend count.
         */
        await fetchUnreadCount();
      } catch (error) {
        console.error(
          'Failed to mark all alerts as read:',
          error
        );
      } finally {
        setLoading(false);
      }
    },
    [fetchUnreadCount]
  );

  // =========================================================
  // CLEAR LOCAL NOTIFICATIONS
  // =========================================================

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // =========================================================
  // UPDATE PREFERENCES
  // =========================================================

  const updatePreferences = useCallback(
    (updates) => {
      setPreferences((prev) => ({
        ...prev,
        ...updates,
      }));
    },
    []
  );

  // =========================================================
  // RESET PREFERENCES
  // =========================================================

  const resetPreferences = useCallback(() => {
    setPreferences({
      ...defaultPreferences,
    });
  }, []);

  // =========================================================
  // TEST NOTIFICATION
  // =========================================================

  const testNotification = useCallback(
    (priority = 'medium') => {
      const mockAlert = {
        _id: `test-${Date.now()}`,
        title: 'Test Notification',
        message: `This is a ${priority} priority test notification.`,
        priority,
      };

      // Toast
      notificationService.info(
        `🔔 ${mockAlert.title}`
      );

      // Sound
      soundService.playForPriority(
        priority
      );

      // Browser
      browserNotificationService.showAlert(
        mockAlert
      );
    },
    []
  );

  // =========================================================
  // CONTEXT VALUE
  // =========================================================

  const value = {
    unreadCount,
    notifications,
    loading,
    preferences,

    fetchUnreadCount,

    markAsRead,
    markAllAsRead,

    clearNotifications,

    updatePreferences,
    resetPreferences,

    testNotification,
  };

  // =========================================================
  // PROVIDER
  // =========================================================

  return (
    <NotificationContext.Provider
      value={value}
    >
      {children}
    </NotificationContext.Provider>
  );
};