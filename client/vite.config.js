import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@components': path.resolve(import.meta.dirname, './src/components'),
      '@pages': path.resolve(import.meta.dirname, './src/pages'),
      '@api': path.resolve(import.meta.dirname, './src/api'),
      '@context': path.resolve(import.meta.dirname, './src/context'),
      '@hooks': path.resolve(import.meta.dirname, './src/hooks'),
      '@utils': path.resolve(import.meta.dirname, './src/utils'),
      '@constants': path.resolve(import.meta.dirname, './src/constants'),
      '@assets': path.resolve(import.meta.dirname, './src/assets'),
      '@styles': path.resolve(import.meta.dirname, './src/styles'),
      '@services': path.resolve(import.meta.dirname, './src/services'),
      '@routes': path.resolve(import.meta.dirname, './src/routes'),
    },
  },

  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          forms: ['react-hook-form'],
          utils: ['axios', 'date-fns', 'classnames'],
        },
      },
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
  },
});
