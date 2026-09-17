import axios from './axios';
import { storage } from '../utils/storage';

export const videosAPI = {
  getAll: async (params = {}) => {
    const response = await axios.get('/videos', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await axios.get(`/videos/${id}`);
    return response.data;
  },

  upload: async (file, data = {}, onProgress) => {
    const formData = new FormData();
    formData.append('video', file);
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await axios.post('/videos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return response.data;
  },

  update: async (id, data) => {
    const response = await axios.put(`/videos/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await axios.delete(`/videos/${id}`);
    return response.data;
  },

  getStreamUrl: (id) => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const token = storage.getToken();
    return `${baseURL}/videos/${id}/stream?token=${token}`;
  },

  getDownloadUrl: (id) => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const token = storage.getToken();
    return `${baseURL}/videos/${id}/download?token=${token}`;
  },

  getStatistics: async () => {
    const response = await axios.get('/videos/statistics');
    return response.data;
  },
};