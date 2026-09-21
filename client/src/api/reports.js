import axiosInstance from './axios';
import { storage } from '../utils/storage';

export const reportsAPI = {
  // ============================================
  // Get all reports
  // ============================================
  getAll: async (params = {}) => {
    const response = await axiosInstance.get('/reports', {
      params,
    });

    return response.data;
  },

  // ============================================
  // Get report by ID
  // ============================================
  getById: async (id) => {
    const response = await axiosInstance.get(
      `/reports/${id}`
    );

    return response.data;
  },

  // ============================================
  // Create report
  // ============================================
  create: async (data) => {
    const response = await axiosInstance.post(
      '/reports',
      data
    );

    return response.data;
  },

  // ============================================
  // Delete report
  // ============================================
  delete: async (id) => {
    const response = await axiosInstance.delete(
      `/reports/${id}`
    );

    return response.data;
  },

  // ============================================
  // Schedule report
  // ============================================
  schedule: async (id, data) => {
    const response = await axiosInstance.post(
      `/reports/${id}/schedule`,
      data
    );

    return response.data;
  },

  // ============================================
  // Get direct download URL
  // ============================================
  getDownloadUrl: (id) => {
    const baseURL =
      import.meta.env.VITE_API_URL ||
      'http://localhost:5000/api';

    return `${baseURL}/reports/${id}/download`;
  },

  // ============================================
  // Download report file
  // ============================================
  //
  // IMPORTANT:
  // We use Axios here instead of window.open()
  // so the JWT Authorization header is included.
  //
  downloadReportFile: async (id) => {
    const token = storage.getToken();

    const response = await axiosInstance.get(
      `/reports/${id}/download`,
      {
        responseType: 'blob',

        headers: {
          Authorization: token
            ? `Bearer ${token}`
            : '',
        },
      }
    );

    return response;
  },

  // ============================================
  // Get report statistics
  // ============================================
  getStatistics: async () => {
    const response = await axiosInstance.get(
      '/reports/statistics'
    );

    return response.data;
  },
};