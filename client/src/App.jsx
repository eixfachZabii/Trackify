import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import DataUpload from './components/DataUpload';
import PhotoGallery from './components/PhotoGallery';
import Analytics from './components/Analytics';
import ProgressView from './components/ProgressView';
import GoalTracker from './components/GoalTracker';
import Reports from './components/Reports';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

// Services
import { apiService } from './services/apiService';

// Context
import { AppProvider } from './context/AppContext';

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
              <li>Run: <code>cd backend && python main.py</code></li>
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