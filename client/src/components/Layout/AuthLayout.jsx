import { Outlet, Navigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import LoadingScreen from '../Common/LoadingScreen';

const AuthLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-secondary-50 dark:bg-secondary-900">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Intelligent CCTV</h1>
              <p className="text-sm text-primary-100">Security System</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            AI-Powered Suspicious Activity Detection
          </h2>
          <p className="text-lg text-primary-100 mb-8">
            Monitor, detect, and respond to security threats in real-time with advanced AI technology.
          </p>
          <div className="space-y-3">
            {[
              'Real-time threat detection',
              'AI-powered video analytics',
              'Instant alert notifications',
              'Comprehensive reporting',
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sm text-primary-200">
          <p>© {new Date().getFullYear()} Intelligent CCTV System. All rights reserved.</p>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-secondary-900 dark:text-white">
                Intelligent CCTV
              </h1>
              <p className="text-sm text-secondary-500">Security System</p>
            </div>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;