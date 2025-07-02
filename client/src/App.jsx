import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import existing components
import Dashboard from './components/Dashboard/Dashboard';

// Import services and context
import { apiService } from './services/apiService.jsx';
import { AppProvider } from './context/AppContext.jsx';

// Simple components to replace missing ones temporarily
import Navbar from './components/Navbar/Navbar.jsx';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary.jsx';

// Placeholder components for now
const DataUpload = () => (
  <div className="page-container">
    <h1>Data Upload</h1>
    <p>Upload your body composition data here. (Coming soon)</p>
  </div>
);

const PhotoGallery = () => (
  <div className="page-container">
    <h1>Photo Gallery</h1>
    <p>View your progress photos here. (Coming soon)</p>
  </div>
);

const Analytics = () => (
  <div className="page-container">
    <h1>Analytics</h1>
    <p>View detailed analytics of your progress. (Coming soon)</p>
  </div>
);

const ProgressView = () => (
  <div className="page-container">
    <h1>Progress View</h1>
    <p>Track your overall progress. (Coming soon)</p>
  </div>
);

const GoalTracker = () => (
  <div className="page-container">
    <h1>Goal Tracker</h1>
    <p>Set and track your fitness goals. (Coming soon)</p>
  </div>
);

const Reports = () => (
  <div className="page-container">
    <h1>Reports</h1>
    <p>Generate progress reports. (Coming soon)</p>
  </div>
);

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [apiHealth, setApiHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      setIsLoading(true);
      const health = await apiService.checkHealth();
      setApiHealth(health);
      setError(null);
    } catch (err) {
      setError('Unable to connect to Trackify API. Please ensure the backend is running.');
      console.error('API Health check failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="app-loading">
        <LoadingSpinner size="large" />
        <p>Connecting to Trackify...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <div className="error-container">
          <h2>Connection Error</h2>
          <p>{error}</p>
          <button onClick={checkApiHealth} className="retry-button">
            Retry Connection
          </button>
          <div className="error-help">
            <h3>Troubleshooting:</h3>
            <ul>
              <li>Make sure the Python backend is running on port 8000</li>
              <li>Run: <code>cd server && python main.py</code></li>
              <li>Check that no firewall is blocking the connection</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AppProvider>
        <Router>
          <div className="app">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/upload" element={<DataUpload />} />
                <Route path="/photos" element={<PhotoGallery />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/progress" element={<ProgressView />} />
                <Route path="/goals" element={<GoalTracker />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>

            {/* API Status Indicator */}
            <div className="api-status">
              <span className={`status-indicator ${apiHealth?.status === 'healthy' ? 'healthy' : 'error'}`}>
                {apiHealth?.status === 'healthy' ? '🟢' : '🔴'}
              </span>
              <span className="status-text">
                API {apiHealth?.status === 'healthy' ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;