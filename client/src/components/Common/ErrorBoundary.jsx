import { Component } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-secondary-800 rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-danger-600 dark:text-danger-400" />
            </div>
            <h1 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-6">
              We encountered an unexpected error. Please try refreshing the page.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 text-left p-4 bg-secondary-100 dark:bg-secondary-900 rounded-lg overflow-auto max-h-48">
                <p className="text-xs font-mono text-danger-600 dark:text-danger-400 break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Reload Page
              </Button>
              <Button variant="primary" onClick={this.handleReset} icon={RefreshCw}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  onReset: PropTypes.func,
};

export default ErrorBoundary;