import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import './MetricCard.css';

const MetricCard = ({ title, metric, data, summary, trend, className = '' }) => {
  // Prepare mini chart data (last 10 points)
  const chartData = data
    .slice(0, 10)
    .map(record => ({
      value: record[metric],
      date: record.date
    }))
    .reverse(); // Chronological order

  const currentValue = summary?.current || 0;
  const previousValue = data.length > 1 ? data[1][metric] : currentValue;
  const change = currentValue - previousValue;
  const changePercent = previousValue !== 0 ? ((change / previousValue) * 100) : 0;

  const getTrendIcon = () => {
    if (!trend) return '📊';

    switch (trend.trend) {
      case 'increasing':
        return metric === 'weight_kg' || metric === 'body_fat_percent' ? '📈⚠️' : '📈✅';
      case 'decreasing':
        return metric === 'weight_kg' || metric === 'body_fat_percent' ? '📉✅' : '📉⚠️';
      default:
        return '📊';
    }
  };

  const getTrendColor = () => {
    if (!trend) return 'neutral';

    // For weight and body fat, decreasing is good
    if (metric === 'weight_kg' || metric === 'body_fat_percent') {
      return trend.trend === 'decreasing' ? 'positive' :
             trend.trend === 'increasing' ? 'negative' : 'neutral';
    }

    // For muscle mass, increasing is good
    if (metric === 'muscle_mass_kg' || metric === 'skeletal_muscle_percent') {
      return trend.trend === 'increasing' ? 'positive' :
             trend.trend === 'decreasing' ? 'negative' : 'neutral';
    }

    return 'neutral';
  };

  const formatValue = (value) => {
    if (typeof value !== 'number') return 'N/A';

    // Format based on metric type
    if (metric.includes('percent')) {
      return `${value.toFixed(1)}%`;
    } else if (metric.includes('kg')) {
      return `${value.toFixed(1)} kg`;
    } else if (metric === 'basal_metabolic_rate') {
      return `${Math.round(value)} kcal`;
    } else if (metric === 'bmi') {
      return value.toFixed(1);
    } else {
      return value.toFixed(1);
    }
  };

  const formatChange = (change) => {
    const formattedChange = Math.abs(change);
    const sign = change >= 0 ? '+' : '-';

    if (metric.includes('percent')) {
      return `${sign}${formattedChange.toFixed(1)}%`;
    } else if (metric.includes('kg')) {
      return `${sign}${formattedChange.toFixed(2)} kg`;
    } else if (metric === 'basal_metabolic_rate') {
      return `${sign}${Math.round(formattedChange)} kcal`;
    } else {
      return `${sign}${formattedChange.toFixed(1)}`;
    }
  };

  const getLineColor = () => {
    const trendColor = getTrendColor();
    switch (trendColor) {
      case 'positive': return '#4CAF50';
      case 'negative': return '#F44336';
      default: return '#2196F3';
    }
  };

  return (
    <div className={`metric-card ${className} ${getTrendColor()}`}>
      <div className="metric-card-header">
        <div className="metric-title">
          <h3>{title}</h3>
          <span className="trend-icon">{getTrendIcon()}</span>
        </div>

        {trend && (
          <div className="trend-period">
            <span className="period-label">30 days</span>
          </div>
        )}
      </div>

      <div className="metric-value">
        <div className="current-value">
          {formatValue(currentValue)}
        </div>

        {change !== 0 && (
          <div className={`value-change ${change >= 0 ? 'positive' : 'negative'}`}>
            {formatChange(change)}
            <span className="change-percent">
              ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%)
            </span>
          </div>
        )}
      </div>

      {/* Mini Chart */}
      {chartData.length > 1 && (
        <div className="mini-chart">
          <ResponsiveContainer width="100%" height={60}>
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={getLineColor()}
                strokeWidth={2}
                dot={false}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary Stats */}
      <div className="metric-stats">
        <div className="stat-item">
          <span className="stat-label">Min</span>
          <span className="stat-value">{formatValue(summary?.min || 0)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Max</span>
          <span className="stat-value">{formatValue(summary?.max || 0)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Avg</span>
          <span className="stat-value">{formatValue(summary?.avg || 0)}</span>
        </div>
      </div>

      {/* Trend Summary */}
      {trend && (
        <div className="trend-summary">
          <div className="trend-direction">
            <span className={`trend-label ${getTrendColor()}`}>
              {trend.trend.charAt(0).toUpperCase() + trend.trend.slice(1)}
            </span>
            <span className="trend-change">
              {formatChange(trend.change)} in {trend.period_days} days
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricCard;