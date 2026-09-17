import axios from './axios';

export const incidentsAPI = {
  getAll: async (params = {}) => {
    const response = await axios.get('/incidents', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await axios.get(`/incidents/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axios.post('/incidents', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await axios.put(`/incidents/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await axios.delete(`/incidents/${id}`);
    return response.data;
  },

  assign: async (id, userId) => {
    const response = await axios.post(`/incidents/${id}/assign`, { assignedTo: userId });
    return response.data;
  },

  resolve: async (id, data) => {
    const response = await axios.post(`/incidents/${id}/resolve`, data);
    return response.data;
  },

  addNote: async (id, data) => {
    const response = await axios.post(`/incidents/${id}/notes`, data);
    return response.data;
  },

  uploadEvidence: async (id, files, type = 'image') => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('type', type);

    const response = await axios.post(`/incidents/${id}/evidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getStatistics: async () => {
    const response = await axios.get('/incidents/statistics');
    return response.data;
  },
};