import axios from './axios';

export const alertsAPI = {
  getAll: async (params = {}) => {
    const response = await axios.get('/alerts', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await axios.get(`/alerts/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axios.post('/alerts', data);
    return response.data;
  },

  delete: async (id) => {
    const response = await axios.delete(`/alerts/${id}`);
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await axios.post(`/alerts/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await axios.post('/alerts/mark-all-read');
    return response.data;
  },

  acknowledge: async (id) => {
    const response = await axios.post(`/alerts/${id}/acknowledge`);
    return response.data;
  },

  getStatistics: async () => {
    const response = await axios.get('/alerts/statistics');
    return response.data;
  },
};