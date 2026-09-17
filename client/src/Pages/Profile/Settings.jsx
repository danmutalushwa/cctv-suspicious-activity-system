import { useState, useEffect } from 'react';
import { Save, Moon, Sun, Monitor } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authAPI } from '../../api/auth';
import { notificationService } from '../../services/notification.service';
import { storage } from '../../utils/storage';
import PageHeader from '../../components/Layout/PageHeader';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import NotificationPreferences from '../../components/Common/NotificationPreferences';
import classNames from 'classnames';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState(storage.getTheme() || 'system');

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else if (newTheme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    storage.setTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await authAPI.updateProfile({ preferences: { theme } });
      updateUser(response.data.user);
      notificationService.success('Settings saved');
    } catch (error) {
      notificationService.error(error.userMessage || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <>
      <PageHeader title="Settings" subtitle="Customize your experience" />

      <div className="max-w-3xl space-y-6">
        <Card title="Appearance">
          <p className="text-sm text-secondary-500 mb-4">Choose your preferred theme</p>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleThemeChange(option.value)}
                  className={classNames(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors',
                    isActive
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-300'
                  )}
                >
                  <Icon
                    size={24}
                    className={isActive ? 'text-primary-600 dark:text-primary-400' : 'text-secondary-500'}
                  />
                  <span
                    className={classNames(
                      'text-sm font-medium',
                      isActive ? 'text-primary-700 dark:text-primary-300' : 'text-secondary-700 dark:text-secondary-300'
                    )}
                  >
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        <NotificationPreferences />

        <div className="flex justify-end">
          <Button variant="primary" icon={Save} onClick={handleSave} loading={saving}>
            Save Settings
          </Button>
        </div>
      </div>
    </>
  );
};

export default Settings;