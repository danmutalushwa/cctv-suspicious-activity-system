import Spinner from './Spinner';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary-50 dark:bg-secondary-900">
      <Spinner size="xl" />
      <p className="mt-4 text-secondary-600 dark:text-secondary-400">{message}</p>
    </div>
  );
};

export default LoadingScreen;