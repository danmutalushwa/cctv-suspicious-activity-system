import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { videosAPI } from '../api/videos';
import { notificationService } from '../services/notification.service';

export const useVideos = (params = {}) => {
  return useQuery({
    queryKey: ['videos', params],
    queryFn: () => videosAPI.getAll(params),
    staleTime: 30000,
    keepPreviousData: true,
  });
};

export const useVideo = (id) => {
  return useQuery({
    queryKey: ['videos', id],
    queryFn: () => videosAPI.getById(id),
    enabled: !!id,
  });
};

export const useVideoStatistics = () => {
  return useQuery({
    queryKey: ['videos', 'statistics'],
    queryFn: () => videosAPI.getStatistics(),
    staleTime: 60000,
  });
};

export const useUploadVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, data, onProgress }) =>
      videosAPI.upload(file, data, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['videos', 'statistics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      notificationService.success('Video uploaded successfully');
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Failed to upload video');
    },
  });
};

export const useUpdateVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => videosAPI.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['videos', variables.id] });
      notificationService.success('Video updated successfully');
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Failed to update video');
    },
  });
};

export const useDeleteVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => videosAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['videos', 'statistics'] });
      notificationService.success('Video deleted successfully');
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Failed to delete video');
    },
  });
};