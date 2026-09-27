import { useMutation, useQuery } from '@tanstack/react-query';
import { aiAPI } from '../api/ai';
import { notificationService } from '../services/notification.service';

export const useAIHealth = () => {
  return useQuery({
    queryKey: ['ai', 'health'],
    queryFn: () => aiAPI.checkHealth(),
    refetchInterval: 30000,
    retry: false,
  });
};

export const useAnalyzeImage = () => {
  return useMutation({
    mutationFn: (file) => aiAPI.analyzeImage(file),
    onError: (error) => {
      notificationService.error(error.userMessage || 'AI analysis failed');
    },
  });
};

export const useAnalyzeAndReport = () => {
  return useMutation({
    mutationFn: ({ file, cameraId }) => aiAPI.analyzeAndReport(file, cameraId),
    onSuccess: (data) => {
      if (data?.data?.incident) {
        notificationService.success(
          `Incident ${data.data.incident.incidentNumber} created from AI detection`
        );
      } else {
        notificationService.info('AI analysis complete — no suspicious activity');
      }
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'AI analysis failed');
    },
  });
};