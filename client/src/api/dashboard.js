import axios from './axios';

export const dashboardAPI = {
  getStats: async () => {
    const response = await axios.get('/dashboard/stats');
    return response.data;
  },

  getRealTime: async () => {
    const response = await axios.get('/dashboard/realtime');
    return response.data;
  },

  getSystemHealth: async () => {
    const response = await axios.get('/dashboard/health');
    return response.data;
  },

  getTimeline: async (days = 7) => {
    const response = await axios.get('/dashboard/timeline', { params: { days } });
    return response.data;
  },

  getTopPerformers: async (period = 'week') => {
    const response = await axios.get('/dashboard/performers', { params: { period } });
    return response.data;
  },

  getHeatmap: async (days = 30) => {
    const response = await axios.get('/dashboard/heatmap', { params: { days } });
    return response.data;
  },
};