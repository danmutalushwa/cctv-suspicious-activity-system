import { storage } from '../utils/storage';

export const storageService = {
  // Token management
  getToken: () => storage.getToken(),
  setToken: (token) => storage.setToken(token),
  removeToken: () => storage.removeToken(),

  // User management
  getUser: () => storage.getUser(),
  setUser: (user) => storage.setUser(user),
  removeUser: () => storage.removeUser(),

  // Theme
  getTheme: () => storage.getTheme(),
  setTheme: (theme) => storage.setTheme(theme),

  // Session
  clearSession: () => storage.clear(),

  // Checks
  isAuthenticated: () => !!storage.getToken(),
};