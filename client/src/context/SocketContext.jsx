import { createContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketService } from '../services/socket';
import { useAuth } from '../hooks/useAuth';
import { notificationService } from '../services/notification.service';

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) {
      setIsConnected(false);
      return;
    }

    const socket = socketService.connect();
    if (!socket) return;

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleError = (error) => console.error('Socket error:', error);

    // Data invalidation handlers
    const invalidateAlerts = () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts', 'statistics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    const invalidateIncidents = () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    const invalidateCameras = () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      queryClient.invalidateQueries({ queryKey: ['cameras', 'statistics'] });
    };

    const invalidateReports = (data) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'statistics'] });
      if (data?.reportId) {
        queryClient.invalidateQueries({ queryKey: ['reports', data.reportId] });
      }
      if (data?.title) {
        notificationService.success(`Report "${data.title}" is ready`);
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleError);

    socket.on('new_alert', invalidateAlerts);
    socket.on('alert_acknowledged', invalidateAlerts);

    socket.on('incident_created', invalidateIncidents);
    socket.on('incident_updated', invalidateIncidents);

    socket.on('camera_created', invalidateCameras);
    socket.on('camera_updated', invalidateCameras);
    socket.on('camera_deleted', invalidateCameras);
    socket.on('camera_stream_started', invalidateCameras);
    socket.on('camera_stream_stopped', invalidateCameras);

    socket.on('report_generated', invalidateReports);
    //temporary
    socket.on('connect', () => console.log('[Socket] connected'));
    socket.on('disconnect', (r) => console.log('[Socket] disconnected:', r));

    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleError);

      socket.off('new_alert', invalidateAlerts);
      socket.off('alert_acknowledged', invalidateAlerts);

      socket.off('incident_created', invalidateIncidents);
      socket.off('incident_updated', invalidateIncidents);

      socket.off('camera_created', invalidateCameras);
      socket.off('camera_updated', invalidateCameras);
      socket.off('camera_deleted', invalidateCameras);
      socket.off('camera_stream_started', invalidateCameras);
      socket.off('camera_stream_stopped', invalidateCameras);

      socket.off('report_generated', invalidateReports);
    };
  }, [isAuthenticated, queryClient]);

  return (
    <SocketContext.Provider value={{ isConnected, socket: socketService.getSocket() }}>
      {children}
    </SocketContext.Provider>
  );
};