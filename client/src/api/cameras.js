import axios from './axios';

export const camerasAPI = {
  getAll: async (params = {}) => {
    const response = await axios.get('/cameras', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await axios.get(`/cameras/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axios.post('/cameras', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await axios.put(`/cameras/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await axios.delete(`/cameras/${id}`);
    return response.data;
  },

  startStream: async (id) => {
    const response = await axios.post(`/cameras/${id}/stream`);
    return response.data;
  },

  stopStream: async (id) => {
    const response = await axios.post(`/cameras/${id}/stop`);
    return response.data;
  },

  testConnection: async (id) => {
    const response = await axios.post(`/cameras/${id}/test`);
    return response.data;
  },

  updateDetectionZones: async (id, zones) => {
    const response = await axios.put(`/cameras/${id}/zones`, { zones });
    return response.data;
  },

  getStatistics: async () => {
    const response = await axios.get('/cameras/statistics');
    return response.data;
  },
};