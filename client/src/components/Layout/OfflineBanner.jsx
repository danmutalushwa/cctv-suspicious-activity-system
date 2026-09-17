import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';

const OfflineBanner = () => {
  const { isConnected } = useSocket();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Keep banner showing for 2s to show "reconnected" state
      setTimeout(() => setShowBanner(false), 2000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Also show banner if socket is disconnected but browser is online
  useEffect(() => {
    if (!isOnline) return;
    setShowBanner(!isConnected);
  }, [isConnected, isOnline]);

  if (!showBanner && isOnline && isConnected) return null;

  const isFullyOffline = !isOnline;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 py-2 px-4 text-center text-sm font-medium ${
        isFullyOffline
          ? 'bg-danger-500 text-white'
          : 'bg-warning-500 text-white'
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        <WifiOff size={16} />
        <span>
          {isFullyOffline
            ? "You're offline. Some features may be unavailable."
            : 'Reconnecting to server...'}
        </span>
      </div>
    </div>
  );
};

export default OfflineBanner;