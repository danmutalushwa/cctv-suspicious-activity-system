import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import classNames from 'classnames';
import { useSocket } from '../../hooks/useSocket';
import { socketService } from '../../services/socket';

const ConnectionStatus = ({ showLabel = true, variant = 'badge' }) => {
  const { isConnected } = useSocket();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [reconnecting, setReconnecting] = useState(false);

  // Browser online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Socket reconnection tracking
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleReconnectAttempt = () => setReconnecting(true);
    const handleReconnect = () => setReconnecting(false);
    const handleConnect = () => setReconnecting(false);

    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('reconnect', handleReconnect);
    socket.on('connect', handleConnect);

    return () => {
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('reconnect', handleReconnect);
      socket.off('connect', handleConnect);
    };
  }, []);

  const status = !isOnline
    ? 'offline'
    : reconnecting
      ? 'reconnecting'
      : isConnected
        ? 'connected'
        : 'disconnected';

  const config = {
    connected: {
      color: 'bg-success-500',
      text: 'text-success-700 dark:text-success-300',
      bg: 'bg-success-100 dark:bg-success-900/30',
      label: 'Live',
      icon: Wifi,
    },
    disconnected: {
      color: 'bg-danger-500',
      text: 'text-danger-700 dark:text-danger-300',
      bg: 'bg-danger-100 dark:bg-danger-900/30',
      label: 'Disconnected',
      icon: WifiOff,
    },
    reconnecting: {
      color: 'bg-warning-500 animate-pulse',
      text: 'text-warning-700 dark:text-warning-300',
      bg: 'bg-warning-100 dark:bg-warning-900/30',
      label: 'Reconnecting...',
      icon: RefreshCw,
    },
    offline: {
      color: 'bg-secondary-500',
      text: 'text-secondary-700 dark:text-secondary-300',
      bg: 'bg-secondary-100 dark:bg-secondary-800',
      label: 'Offline',
      icon: WifiOff,
    },
  };

  const cfg = config[status];
  const Icon = cfg.icon;

  if (variant === 'dot') {
    return (
      <div
        className={classNames('w-2 h-2 rounded-full', cfg.color)}
        title={cfg.label}
      />
    );
  }

  if (variant === 'icon') {
    return (
      <Icon
        size={16}
        className={cfg.text}
        title={cfg.label}
      />
    );
  }

  return (
    <div
      className={classNames(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
        cfg.bg
      )}
    >
      <span className={classNames('w-2 h-2 rounded-full flex-shrink-0', cfg.color)} />
      {showLabel && (
        <span className={classNames('text-xs font-medium', cfg.text)}>
          {cfg.label}
        </span>
      )}
    </div>
  );
};

ConnectionStatus.propTypes = {};

export default ConnectionStatus;