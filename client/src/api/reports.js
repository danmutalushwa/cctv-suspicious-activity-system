import axios from './axios';

export const reportsAPI = {
  getAll: async (params = {}) => {
    const response = await axios.get('/reports', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await axios.get(`/reports/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axios.post('/reports', data);
    return response.data;
  },

  delete: async (id) => {
    const response = await axios.delete(`/reports/${id}`);
    return response.data;
  },

  schedule: async (id, data) => {
    const response = await axios.post(`/reports/${id}/schedule`, data);
    return response.data;
  },

  getDownloadUrl: (id) => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return `${baseURL}/reports/${id}/download`;
  },

  getStatistics: async () => {
    const response = await axios.get('/reports/statistics');
    return response.data;
  },
};