import { useState } from 'react';
import PropTypes from 'prop-types';
import { Bell, Volume2, Monitor, Info, RotateCcw, Play } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import Checkbox from './Checkbox';
import Select from './Select';
import { useNotifications } from '../../hooks/useNotifications';
import { browserNotificationService } from '../../services/browserNotification.service';

const NotificationPreferences = () => {
  const {
    preferences,
    updatePreferences,
    resetPreferences,
    testNotification,
  } = useNotifications();

  const [browserPermission, setBrowserPermission] = useState(
    browserNotificationService.getPermission()
  );

  const priorityOptions = [
    { value: 'low', label: 'All notifications (Low)' },
    { value: 'medium', label: 'Medium & above' },
    { value: 'high', label: 'High & above' },
    { value: 'critical', label: 'Critical only' },
  ];

  const handleRequestPermission = async () => {
    const result = await browserNotificationService.requestPermission();
    setBrowserPermission(result);
  };

  return (
    <div className="space-y-6">
      <Card
        title="Notification Channels"
        subtitle="Choose how you want to be notified"
      >
        <div className="space-y-4">
          <Checkbox
            name="toast"
            label="In-app toast notifications"
            checked={preferences.toast}
            onChange={(e) => updatePreferences({ toast: e.target.checked })}
          />
          <Checkbox
            name="sound"
            label="Sound alerts"
            checked={preferences.sound}
            onChange={(e) => updatePreferences({ sound: e.target.checked })}
          />

          <div className="flex items-start gap-3">
            <Checkbox
              name="browser"
              label="Browser desktop notifications"
              checked={preferences.browser}
              onChange={(e) => updatePreferences({ browser: e.target.checked })}
            />
            {preferences.browser && browserPermission !== 'granted' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-warning-600 dark:text-warning-400">
                  Permission: {browserPermission}
                </span>
                {browserPermission !== 'denied' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRequestPermission}
                  >
                    Enable
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card title="Priority Filter">
        <div className="space-y-3">
          <p className="text-sm text-secondary-500">
            Only notify me for alerts at or above this priority level:
          </p>
          <Select
            name="minPriority"
            value={preferences.minPriority}
            onChange={(e) => updatePreferences({ minPriority: e.target.value })}
            options={priorityOptions}
          />
        </div>
      </Card>

      <Card title="Test Your Notifications">
        <p className="text-sm text-secondary-500 mb-4">
          Try each priority level to make sure notifications work on your device.
        </p>
        <div className="flex flex-wrap gap-2">
          {['low', 'medium', 'high', 'critical'].map((priority) => (
            <Button
              key={priority}
              variant="outline"
              size="sm"
              icon={Play}
              onClick={() => testNotification(priority)}
            >
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </Button>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" icon={RotateCcw} onClick={resetPreferences}>
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
};

NotificationPreferences.propTypes = {};

export default NotificationPreferences;