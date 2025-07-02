import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiService } from '../../services/apiService.jsx';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner.jsx';
import './Dashboard.css';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('weight_kg');
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get date range based on selection
      const { startDate, endDate } = apiService.getDateRange(timeRange);

      // Load data
      const [bodyData, summaryData] = await Promise.all([
        apiService.getBodyCompositionData({
          startDate,
          endDate,
          limit: timeRange === 'year' ? 365 : 100
        }),
        apiService.getCachedMetricsSummary().catch(() => ({})) // Fallback to empty object if fails
      ]);

      // Transform data for charts
      const transformedData = apiService.transformBodyCompositionData(bodyData);

      setData(transformedData);
      setSummary(summaryData);

    } catch (err) {
      setError(err.message);
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMetricDisplayName = (metric) => {
    const names = {
      weight_kg: 'Weight (kg)',
      body_fat_percent: 'Body Fat (%)',
      muscle_mass_kg: 'Muscle Mass (kg)',
      bmi: 'BMI',
      body_water_percent: 'Body Water (%)',
      skeletal_muscle_percent: 'Skeletal Muscle (%)',
      basal_metabolic_rate: 'BMR (kcal)',
      visceral_fat: 'Visceral Fat'
    };
    return names[metric] || metric;
  };

  const formatTooltip = (value, name) => {
    const unit = name.includes('percent') ? '%' : name.includes('kg') ? ' kg' : name.includes('kcal') ? ' kcal' : '';
    return [`${value}${unit}`, getMetricDisplayName(name)];
  };
  if (loading) {
    return (
      <div className="dashboard-loading">
        <LoadingSpinner size="large" text="Loading your fitness dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Unable to load dashboard</h2>
        <p>{error}</p>
        <button onClick={loadDashboardData} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  const chartData = data.map(record => ({
    date: record.displayDate,
    [selectedMetric]: record[selectedMetric],
    fullDate: record.date
  })).reverse(); // Reverse to show chronological order

  const latest = data[0] || {};
  const hasData = data.length > 0;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Your Fitness Dashboard</h1>
          <p className="welcome-message">
            {hasData
              ? `Latest measurement: ${latest.displayDate}`
              : 'Upload your first measurement to get started!'
            }
          </p>
        </div>

        <div className="header-controls">
          <div className="time-range-selector">
            {['week', 'month', 'quarter', 'year'].map(range => (
              <button
                key={range}
                className={`range-button ${timeRange === range ? 'active' : ''}`}
                onClick={() => setTimeRange(range)}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {hasData ? (
        <>
          {/* Quick Stats Section */}
          <div className="quick-stats">
            <div className="stat-card">
              <div className="stat-label">Current Weight</div>
              <div className="stat-value">{latest.weight_kg?.toFixed(1) || '--'} kg</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Body Fat</div>
              <div className="stat-value">{latest.body_fat_percent?.toFixed(1) || '--'}%</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Muscle Mass</div>
              <div className="stat-value">{latest.muscle_mass_kg?.toFixed(1) || '--'} kg</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">BMI</div>
              <div className="stat-value">{latest.bmi?.toFixed(1) || '--'}</div>
            </div>
          </div>

          {/* Main Chart Section */}
          <div className="main-chart-section card">
            <div className="chart-header">
              <h2>Progress Tracking</h2>
              <div className="metric-selector">
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className="metric-select input-base"
                >
                  <option value="weight_kg">Weight</option>
                  <option value="body_fat_percent">Body Fat %</option>
                  <option value="muscle_mass_kg">Muscle Mass</option>
                  <option value="bmi">BMI</option>
                  <option value="body_water_percent">Body Water %</option>
                  <option value="skeletal_muscle_percent">Skeletal Muscle %</option>
                  <option value="basal_metabolic_rate">BMR</option>
                  <option value="visceral_fat">Visceral Fat</option>
                </select>
              </div>
            </div>

            <div className="chart-container">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={formatTooltip}
                      labelStyle={{ color: '#333' }}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: '8px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey={selectedMetric}
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-chart-data">
                  <p>No data available for the selected metric and time range.</p>
                </div>
              )}
            </div>
          </div>

          {/* Data Summary */}
          <div className="data-summary card">
            <h3>Data Summary</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Total Measurements</span>
                <span className="summary-value">{data.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Date Range</span>
                <span className="summary-value">
                  {data.length > 1
                    ? `${data[data.length - 1].displayDate} - ${data[0].displayDate}`
                    : data[0]?.displayDate || 'No data'
                  }
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Latest Update</span>
                <span className="summary-value">{latest.displayDate || 'No data'}</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="no-data-state card">
          <div className="no-data-content">
            <h2>Welcome to Trackify! 🎯</h2>
            <p>Get started by uploading your first body composition data or progress photos.</p>
            <div className="getting-started-actions">
              <button
                className="primary-button"
                onClick={() => window.location.href = '/upload'}
              >
                Upload Data
              </button>
              <button
                className="secondary-button"
                onClick={() => window.location.href = '/photos'}
              >
                Add Photos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;