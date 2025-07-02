import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI
    // Prefixed with underscore to indicate intentionally unused parameter
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and potentially to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-container">
            <div className="error-icon">⚠️</div>
            <h1>Oops! Something went wrong</h1>
            <p className="error-message">
              We're sorry, but something unexpected happened. The application has encountered an error.
            </p>

            <div className="error-actions">
              <button
                onClick={this.handleRetry}
                className="primary-button"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="secondary-button"
              >
                Reload Page
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <div className="error-info">
                  <h3>Error:</h3>
                  <pre>{this.state.error.toString()}</pre>

                  <h3>Component Stack:</h3>
                  <pre>{this.state.errorInfo.componentStack}</pre>

                  <h3>Stack Trace:</h3>
                  <pre>{this.state.error.stack}</pre>
                </div>
              </details>
            )}

            <div className="error-help">
              <h3>What you can do:</h3>
              <ul>
                <li>Try refreshing the page</li>
                <li>Check your internet connection</li>
                <li>Make sure the backend server is running</li>
                <li>If the problem persists, please contact support</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;