// API Service for Trackify
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method for making requests
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorData);
          errorMessage = errorJson.detail || errorJson.error || `HTTP ${response.status}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return await response.text();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Helper method for form data requests (file uploads)
  async makeFormRequest(endpoint, formData, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: 'POST',
      body: formData,
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorData);
          errorMessage = errorJson.detail || errorJson.error || `HTTP ${response.status}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Health and Status
  async checkHealth() {
    return this.makeRequest('/health');
  }

  // Data Upload and Management
  async uploadExcelFile(file, onProgress = null) {
    this._onProgress = onProgress;
    const formData = new FormData();
    formData.append('file', file);

    return this.makeFormRequest('/api/upload-excel', formData);
  }

  async getBodyCompositionData(params = {}) {
    const queryParams = new URLSearchParams();

    if (params.startDate) queryParams.append('start_date', params.startDate);
    if (params.endDate) queryParams.append('end_date', params.endDate);
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/api/body-composition${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.makeRequest(endpoint);
  }

  async getMetricsSummary() {
    return this.makeRequest('/api/metrics-summary');
  }

  // Photo Management
  async uploadPhoto(file, date = null, tags = 'progress') {
    const formData = new FormData();
    formData.append('file', file);
    if (date) formData.append('date', date);
    formData.append('tags', tags);

    return this.makeFormRequest('/api/upload-photo', formData);
  }

  async getPhotos(params = {}) {
    const queryParams = new URLSearchParams();

    if (params.startDate) queryParams.append('start_date', params.startDate);
    if (params.endDate) queryParams.append('end_date', params.endDate);
    if (params.tags) queryParams.append('tags', params.tags);

    const endpoint = `/api/photos${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.makeRequest(endpoint);
  }

  async deletePhoto(photoId) {
    return this.makeRequest(`/api/photos/${photoId}`, { method: 'DELETE' });
  }

  // Analytics
  async getTrendAnalysis(startDate, endDate, metrics = ['weight_kg', 'body_fat_percent', 'muscle_mass_kg']) {
    return this.makeRequest('/api/analytics/trends', {
      method: 'POST',
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate,
        metrics: metrics,
      }),
    });
  }

  async getMetricCorrelations() {
    return this.makeRequest('/api/analytics/correlations');
  }

  async getProgressPredictions(daysAhead = 30) {
    return this.makeRequest(`/api/analytics/predictions?days_ahead=${daysAhead}`);
  }

  async checkGoalProgress(targetWeight, targetDate) {
    const params = new URLSearchParams({
      target_weight: targetWeight.toString(),
      target_date: targetDate,
    });
    return this.makeRequest(`/api/analytics/goals?${params}`);
  }

  // Reports and Export
  async generateProgressReport(startDate, endDate, includePhotos = true) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      include_photos: includePhotos.toString(),
    });
    return this.makeRequest(`/api/export/report?${params}`);
  }

  async exportDataCSV(startDate = null, endDate = null) {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);

    const endpoint = `/api/export/csv${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.makeRequest(endpoint);
  }

  // Utility methods for data processing
  formatDateForAPI(date) {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date;
  }

  // Calculate date ranges
  getDateRange(period) {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(end.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        start.setMonth(end.getMonth() - 1); // Default to last month
    }

    return {
      startDate: this.formatDateForAPI(start),
      endDate: this.formatDateForAPI(end),
    };
  }

  // Data transformation helpers
  transformBodyCompositionData(data) {
    return data.map(record => ({
      ...record,
      date: new Date(record.date),
      displayDate: new Date(record.date).toLocaleDateString(),
    }));
  }

  transformPhotosData(photos) {
    return photos.map(photo => ({
      ...photo,
      date: new Date(photo.date),
      displayDate: new Date(photo.date).toLocaleDateString(),
      fullImageUrl: `${this.baseURL}${photo.file_path}`,
      thumbnailUrl: `${this.baseURL}${photo.thumbnail_path}`,
    }));
  }

  // Chart data helpers
  prepareChartData(data, xField = 'date', yFields = ['weight_kg']) {
    return data.map(record => {
      const point = { [xField]: record[xField] };
      yFields.forEach(field => {
        point[field] = record[field];
      });
      return point;
    });
  }

  // Batch operations
  async batchUploadPhotos(files, defaultTags = 'progress') {
    const uploads = [];
    for (const file of files) {
      try {
        const result = await this.uploadPhoto(file, null, defaultTags);
        uploads.push({ success: true, file: file.name, result });
      } catch (error) {
        uploads.push({ success: false, file: file.name, error: error.message });
      }
    }
    return uploads;
  }

  // Error handling helpers
  isNetworkError(error) {
    return error.message.includes('fetch') || error.message.includes('Network');
  }

  isServerError(error) {
    return error.message.includes('500') || error.message.includes('502') || error.message.includes('503');
  }

  // Cache management (simple in-memory cache)
  cache = new Map();

  async getCachedData(key, fetcher, ttl = 5 * 60 * 1000) { // 5 minutes default TTL
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    try {
      const data = await fetcher();
      this.cache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      // Return cached data if available, even if expired
      if (cached) {
        console.warn('Using expired cache due to error:', error);
        return cached.data;
      }
      throw error;
    }
  }

  clearCache() {
    this.cache.clear();
  }

  // Specific cached methods
  async getCachedMetricsSummary() {
    return this.getCachedData('metrics-summary', () => this.getMetricsSummary());
  }

  async getCachedRecentData(limit = 30) {
    return this.getCachedData(
      `recent-data-${limit}`,
      () => this.getBodyCompositionData({ limit }),
      2 * 60 * 1000 // 2 minutes cache for recent data
    );
  }
}

// Create and export singleton instance
export const apiService = new ApiService();

// Export the class for testing
export { ApiService };

// Export utility functions
export const dateUtils = {
  formatForAPI: (date) => apiService.formatDateForAPI(date),
  getDateRange: (period) => apiService.getDateRange(period),
  isValidDate: (date) => date instanceof Date && !isNaN(date),
  addDays: (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },
  subtractDays: (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  },
  getDaysBetween: (start, end) => {
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },
};

export default apiService;