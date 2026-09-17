import axios from './axios';

export const usersAPI = {
  getAll: async (params = {}) => {
    const response = await axios.get('/users', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await axios.get(`/users/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axios.post('/users', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await axios.put(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await axios.delete(`/users/${id}`);
    return response.data;
  },

  toggleStatus: async (id) => {
    const response = await axios.patch(`/users/${id}/toggle-status`);
    return response.data;
  },
};