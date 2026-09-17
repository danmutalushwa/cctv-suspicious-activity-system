import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { SocketProvider } from './context/SocketContext';
import ErrorBoundary from './components/Common/ErrorBoundary';
import AppRoutes from './routes/AppRoutes';

function AppContent() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-primary-600 mb-4">
                Intelligent CCTV System
              </h1>
              <p className="text-secondary-600 dark:text-secondary-400">
                Step 2 complete! API Layer, Constants, and Core Setup ready.
              </p>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary> 
  );
}

export default App;