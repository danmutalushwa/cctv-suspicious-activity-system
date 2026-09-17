import { createContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/auth';
import { storageService } from '../services/storage.service';
import { socketService } from '../services/socket';
import { notificationService } from '../services/notification.service';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth from storage
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = storageService.getToken();
      const storedUser = storageService.getUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        setIsAuthenticated(true);

        try {
          const response = await authAPI.getMe();
          setUser(response.data.user);
          storageService.setUser(response.data.user);
        } catch (error) {
          console.error('Failed to refresh user:', error);
          if (error.response?.status === 401) {
            storageService.clearSession();
            setUser(null);
            setToken(null);
            setIsAuthenticated(false);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Connect/disconnect socket on auth changes
  useEffect(() => {
    if (isAuthenticated && token) {
      socketService.connect();
    } else {
      socketService.disconnect();
    }
  }, [isAuthenticated, token]);

  const login = useCallback(async (credentials) => {
    const response = await authAPI.login(credentials);
    const { user: userData, token: authToken } = response.data;

    storageService.setToken(authToken);
    storageService.setUser(userData);
    setToken(authToken);
    setUser(userData);
    setIsAuthenticated(true);

    return response;
  }, []);

  const register = useCallback(async (data) => {
    const response = await authAPI.register(data);
    const { user: userData, token: authToken } = response.data;

    storageService.setToken(authToken);
    storageService.setUser(userData);
    setToken(authToken);
    setUser(userData);
    setIsAuthenticated(true);

    return response;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      storageService.clearSession();
      socketService.disconnect();
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      notificationService.info('You have been logged out');
    }
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    storageService.setUser(updatedUser);
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};