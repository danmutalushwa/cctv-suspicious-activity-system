import { createContext, useState, useCallback, useEffect, useRef } from 'react';
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
  minPriority: 'low', // low | medium | high | critical
};

const PRIORITY_LEVELS = { low: 1, medium: 2, high: 3, critical: 4 };

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = storage.getPreferences?.();
      if (saved) return { ...defaultPreferences, ...saved };
    } catch (e) {
      // fallback
    }
    return defaultPreferences;
  });

  const { isAuthenticated } = useAuth();
  const seenAlertIds = useRef(new Set());

  // Persist preferences
  useEffect(() => {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    soundService.setEnabled(preferences.sound);
  }, [preferences]);

  // Fetch unread count on mount
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await alertsAPI.getStatistics();
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
    }
  }, [isAuthenticated, fetchUnreadCount]);

  // Handle new alert with all notification channels
  const handleNewAlert = useCallback(
    (alert) => {
      // Dedupe alerts
      if (seenAlertIds.current.has(alert._id)) return;
      seenAlertIds.current.add(alert._id);
      if (seenAlertIds.current.size > 200) {
        // Reset if too large
        const arr = Array.from(seenAlertIds.current);
        seenAlertIds.current = new Set(arr.slice(-100));
      }

      // Add to list + increment count
      setNotifications((prev) => [alert, ...prev].slice(0, 50));
      setUnreadCount((prev) => prev + 1);

      // Check priority threshold
      const alertPriorityLevel = PRIORITY_LEVELS[alert.priority] || 1;
      const minPriorityLevel = PRIORITY_LEVELS[preferences.minPriority] || 1;
      const shouldNotify = alertPriorityLevel >= minPriorityLevel;

      if (!shouldNotify) return;

      // 1. Toast notification
      if (preferences.toast) {
        const toastFn =
          alert.priority === 'critical' || alert.priority === 'high'
            ? notificationService.alert
            : notificationService.info;

        toastFn(`🔔 ${alert.title}`, {
          toastId: alert._id,
          autoClose: alert.priority === 'critical' ? 15000 : 8000,
        });
      }

      // 2. Sound
      if (preferences.sound) {
        soundService.playForPriority(alert.priority);
      }

      // 3. Browser notification
      if (preferences.browser) {
        browserNotificationService.showAlert(alert);
      }
    },
    [preferences]
  );

  // Listen to socket events
  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = socketService.getSocket();
    if (!socket) return;

    const onNewAlert = (data) => {
      const alert = data.alert;
      if (alert) handleNewAlert(alert);
    };

    const onAlertAcknowledged = () => {
      fetchUnreadCount();
    };

    socket.on('new_alert', onNewAlert);
    socket.on('alert_acknowledged', onAlertAcknowledged);

    return () => {
      socket.off('new_alert', onNewAlert);
      socket.off('alert_acknowledged', onAlertAcknowledged);
    };
  }, [isAuthenticated, handleNewAlert, fetchUnreadCount]);

  // Request browser permission on login
  useEffect(() => {
    if (
      isAuthenticated &&
      preferences.browser &&
      browserNotificationService.getPermission() === 'default'
    ) {
      browserNotificationService.requestPermission();
    }
  }, [isAuthenticated, preferences.browser]);

  // Initialize audio on first click (browser autoplay policy)
  useEffect(() => {
    const initAudio = () => {
      soundService.initialize();
      document.removeEventListener('click', initAudio);
    };
    document.addEventListener('click', initAudio);
    return () => document.removeEventListener('click', initAudio);
  }, []);

  // API methods
  const markAsRead = useCallback(async (alertId) => {
    try {
      await alertsAPI.markAsRead(alertId);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === alertId
            ? { ...n, recipients: n.recipients?.map((r) => ({ ...r, status: 'read' })) }
            : n
        )
      );
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      setLoading(true);
      await alertsAPI.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          recipients: n.recipients?.map((r) => ({ ...r, status: 'read' })),
        }))
      );
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const updatePreferences = useCallback((updates) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
  }, []);

  const testNotification = useCallback((priority = 'medium') => {
    const mockAlert = {
      _id: `test-${Date.now()}`,
      title: 'Test Notification',
      message: `This is a ${priority} priority test notification.`,
      priority,
    };

    // Toast
    notificationService.info(`🔔 ${mockAlert.title}`);
    // Sound
    soundService.playForPriority(priority);
    // Browser
    browserNotificationService.showAlert(mockAlert);
  }, []);

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

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};