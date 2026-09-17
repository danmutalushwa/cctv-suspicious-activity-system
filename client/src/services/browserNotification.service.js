/**
 * Browser Notification API wrapper
 */

let permission = 'default';

export const browserNotificationService = {
  /**
   * Check if browser notifications are supported
   */
  isSupported: () => {
    return 'Notification' in window;
  },

  /**
   * Get current permission status
   */
  getPermission: () => {
    if (!browserNotificationService.isSupported()) return 'unsupported';
    return Notification.permission;
  },

  /**
   * Request permission from user
   */
  requestPermission: async () => {
    if (!browserNotificationService.isSupported()) {
      console.warn('Browser notifications not supported');
      return 'unsupported';
    }

    try {
      permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  },

  /**
   * Show a browser notification
   */
  show: (title, options = {}) => {
    if (!browserNotificationService.isSupported()) return null;
    if (Notification.permission !== 'granted') return null;

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: options.tag || 'cctv-notification',
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        ...options,
      });

      // Auto-close after timeout
      if (options.autoClose !== false) {
        setTimeout(() => notification.close(), options.timeout || 10000);
      }

      // Handle click
      if (options.onClick) {
        notification.onclick = (e) => {
          e.preventDefault();
          window.focus();
          options.onClick();
          notification.close();
        };
      }

      return notification;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return null;
    }
  },

  /**
   * Show alert notification
   */
  showAlert: (alert) => {
    const priorityEmoji = {
      critical: '🚨',
      high: '⚠️',
      medium: '🔔',
      low: 'ℹ️',
    };

    const emoji = priorityEmoji[alert.priority] || '🔔';

    return browserNotificationService.show(`${emoji} ${alert.title}`, {
      body: alert.message,
      tag: `alert-${alert._id}`,
      requireInteraction: alert.priority === 'critical',
      onClick: () => {
        window.location.href = `/alerts/${alert._id}`;
      },
      timeout: alert.priority === 'critical' ? 20000 : 8000,
    });
  },

  /**
   * Close all notifications with a given tag
   */
  closeByTag: (tag) => {
    // Browser doesn't expose list of notifications, but tag ensures replacement
    console.log(`Tag: ${tag}`);
  },
};