import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { apiService } from '../services/apiService';
import LoadingSpinner from './LoadingSpinner';
import MetricCard from './MetricCard';
import QuickStats from './QuickStats';
import RecentPhotos from './RecentPhotos';
import './Dashboard.css';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [recentPhotos, setRecentPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('weight_kg');
  const [timeRange, setTimeRange] = useState('month'); // week, month, quarter, year

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get date range based on selection
      const { startDate, endDate } = apiService.getDateRange(timeRange);

      // Load all dashboard data in parallel
      const [bodyData, summaryData, photosData] = await Promise.all([
        apiService.getBodyCompositionData({
          startDate,
          endDate,
          limit: timeRange === 'year' ? 365 : 100
        }),
        apiService.getCachedMetricsSummary(),
        apiService.getPhotos({ limit: 6 }) // Recent 6 photos
      ]);

      // Transform data for charts
      const transformedData = apiService.transformBodyCompositionData(bodyData);
      const transformedPhotos = apiService.transformPhotosData(photosData);

      setData(transformedData);
      setSummary(summaryData);
      setRecentPhotos(transformedPhotos);

    } catch (err) {
      setError(err.message);
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMetricChange = (metric) => {
    setSelectedMetric(metric);
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
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

  const formatXAxisDate = (dateStr) => {
    const date = new Date(dateStr);
    return timeRange === 'week'
      ? date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <LoadingSpinner size="large" />
        <p>Loading your fitness dashboard...</p>
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
                onClick={() => handleTimeRangeChange(range)}
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
          <QuickStats summary={summary} latest={latest} />

          {/* Main Chart Section */}
          <div className="main-chart-section">
            <div className="chart-header">
              <h2>Progress Tracking</h2>
              <div className="metric-selector">
                <select
                  value={selectedMetric}
                  onChange={(e) => handleMetricChange(e.target.value)}
                  className="metric-select"
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
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
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
                  <Area
                    type="monotone"
                    dataKey={selectedMetric}
                    stroke="#8884d8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMetric)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="metrics-grid">
            <MetricCard
              title="Weight Progress"
              metric="weight_kg"
              data={data}
              summary={summary?.current_stats?.weight_kg}
              trend={summary?.trends?.weight_kg?.month}
            />
            <MetricCard
              title="Body Fat"
              metric="body_fat_percent"
              data={data}
              summary={summary?.current_stats?.body_fat_percent}
              trend={summary?.trends?.body_fat_percent?.month}
            />
            <MetricCard
              title="Muscle Mass"
              metric="muscle_mass_kg"
              data={data}
              summary={summary?.current_stats?.muscle_mass_kg}
              trend={summary?.trends?.muscle_mass_kg?.month}
            />
            <MetricCard
              title="BMI"
              metric="bmi"
              data={data}
              summary={summary?.current_stats?.bmi}
              trend={summary?.trends?.bmi?.month}
            />
          </div>

          {/* Recent Photos Section */}
          {recentPhotos.length > 0 && (
            <RecentPhotos photos={recentPhotos} />
          )}

          {/* Achievements Section */}
          {summary?.achievements && summary.achievements.length > 0 && (
            <div className="achievements-section">
              <h2>Recent Achievements 🏆</h2>
              <div className="achievements-grid">
                {summary.achievements.slice(0, 3).map((achievement, index) => (
                  <div key={index} className="achievement-card">
                    <div className="achievement-icon">
                      {achievement.type === 'weight_loss' && '⚖️'}
                      {achievement.type === 'muscle_gain' && '💪'}
                      {achievement.type === 'fat_loss' && '🔥'}
                    </div>
                    <div className="achievement-content">
                      <h3>{achievement.description}</h3>
                      <p className={`achievement-category ${achievement.category}`}>
                        {achievement.category.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Health Insights */}
          {summary?.health_insights && summary.health_insights.length > 0 && (
            <div className="insights-section">
              <h2>Health Insights 💡</h2>
              <div className="insights-list">
                {summary.health_insights.map((insight, index) => (
                  <div key={index} className="insight-card">
                    <p>{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="no-data-state">
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