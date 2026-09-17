import { io } from 'socket.io-client';
import { storage } from '../utils/storage';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;
let reconnectTimer = null;

export const socketService = {
  connect: () => {
        const token = storage.getToken();
        if (!token) return null;

        // Already connected or connecting → reuse
        if (socket) {
            if (!socket.connected && !socket.active) {
            socket.connect();
            }
            return socket;
        }

        socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            randomizationFactor: 0.5,
            timeout: 20000,
        });

        socket.on('connect', () => console.log('[Socket] connected:', socket.id));
        socket.on('disconnect', (reason) => console.log('[Socket] disconnected:', reason));
        socket.on('connect_error', (error) => console.error('[Socket] error:', error.message));

      return socket; 
  },
  disconnect: () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getSocket: () => socket,
  isConnected: () => socket?.connected || false,
  on: (event, callback) => socket?.on(event, callback),
  off: (event, callback) => socket?.off(event, callback),
  emit: (event, data) => socket?.emit(event, data),
  
};