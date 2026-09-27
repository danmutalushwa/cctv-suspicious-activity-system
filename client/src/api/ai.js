import axios from './axios';

export const aiAPI = {
  checkHealth: async () => {
    const response = await axios.get('/ai/health');
    return response.data;
  },

  getModelInfo: async () => {
    const response = await axios.get('/ai/model-info');
    return response.data;
  },

  /**
   * Analyze an image (returns AI result only)
   */
  analyzeImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await axios.post('/ai/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return response.data;
  },

  /**
   * Analyze an image AND create incident + alert if suspicious
   */
  analyzeAndReport: async (file, cameraId) => {
    const formData = new FormData();
    formData.append('image', file);
    if (cameraId) formData.append('cameraId', cameraId);

    const response = await axios.post('/ai/analyze-and-report', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return response.data;
  },
};