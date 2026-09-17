import axios from './axios';

export const authAPI = {
  register: async (data) => {
    const response = await axios.post('/auth/register', data);
    return response.data;
  },

  login: async (data) => {
    const response = await axios.post('/auth/login', data);
    return response.data;
  },

  logout: async () => {
    const response = await axios.post('/auth/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await axios.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await axios.put('/auth/profile', data);
    return response.data;
  },

  changePassword: async (data) => {
    const response = await axios.put('/auth/change-password', data);
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await axios.post('/auth/forgot-password', { email });
    return response.data;
  },
};