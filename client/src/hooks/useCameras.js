import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { camerasAPI } from '../api/cameras';
import { notificationService } from '../services/notification.service';

export const useCameras = (params = {}) => {
  return useQuery({
    queryKey: ['cameras', params],
    queryFn: () => camerasAPI.getAll(params),
    staleTime: 30000,
    keepPreviousData: true,
    refetchInterval: 30000, // Refresh status every 30s
  });
};

export const useCamera = (id) => {
  return useQuery({
    queryKey: ['cameras', id],
    queryFn: () => camerasAPI.getById(id),
    enabled: !!id,
    refetchInterval: 10000,
  });
};

export const useCameraStatistics = () => {
  return useQuery({
    queryKey: ['cameras', 'statistics'],
    queryFn: () => camerasAPI.getStatistics(),
    staleTime: 60000,
  });
};

export const useCreateCamera = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => camerasAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      notificationService.success('Camera added successfully');
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Failed to add camera');
    },
  });
};

export const useUpdateCamera = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => camerasAPI.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      queryClient.invalidateQueries({ queryKey: ['cameras', variables.id] });
      notificationService.success('Camera updated successfully');
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Failed to update camera');
    },
  });
};

export const useDeleteCamera = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => camerasAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      notificationService.success('Camera deleted successfully');
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Failed to delete camera');
    },
  });
};

export const useStartStream = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => camerasAPI.startStream(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['cameras', id] });
      notificationService.success('Stream started');
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Failed to start stream');
    },
  });
};

export const useStopStream = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => camerasAPI.stopStream(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['cameras', id] });
      notificationService.success('Stream stopped');
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Failed to stop stream');
    },
  });
};

export const useTestCameraConnection = () => {
  return useMutation({
    mutationFn: (id) => camerasAPI.testConnection(id),
    onSuccess: (data) => {
      if (data.data?.connected) {
        notificationService.success('Camera connection successful');
      } else {
        notificationService.warning('Camera is not responding');
      }
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Connection test failed');
    },
  });
};

export const useUpdateDetectionZones = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, zones }) => camerasAPI.updateDetectionZones(id, zones),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cameras', variables.id] });
      notificationService.success('Detection zones updated');
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Failed to update zones');
    },
  });
};