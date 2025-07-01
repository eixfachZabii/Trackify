import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { apiService } from '../services/apiService';

// Initial state
const initialState = {
  // Data
  bodyCompositionData: [],
  photos: [],
  summary: null,

  // UI State
  isLoading: false,
  error: null,

  // User preferences
  preferences: {
    theme: 'light',
    defaultMetric: 'weight_kg',
    defaultTimeRange: 'month',
    units: 'metric', // metric or imperial
  },

  // App state
  lastDataUpdate: null,
  isOnline: navigator.onLine,
};

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',

  SET_BODY_DATA: 'SET_BODY_DATA',
  ADD_BODY_DATA: 'ADD_BODY_DATA',
  SET_PHOTOS: 'SET_PHOTOS',
  ADD_PHOTO: 'ADD_PHOTO',
  REMOVE_PHOTO: 'REMOVE_PHOTO',
  SET_SUMMARY: 'SET_SUMMARY',

  SET_PREFERENCES: 'SET_PREFERENCES',
  UPDATE_PREFERENCE: 'UPDATE_PREFERENCE',

  SET_ONLINE_STATUS: 'SET_ONLINE_STATUS',
  SET_LAST_UPDATE: 'SET_LAST_UPDATE',
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };

    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null };

    case ActionTypes.SET_BODY_DATA:
      return {
        ...state,
        bodyCompositionData: action.payload,
        lastDataUpdate: new Date().toISOString()
      };

    case ActionTypes.ADD_BODY_DATA:
      return {
        ...state,
        bodyCompositionData: [action.payload, ...state.bodyCompositionData],
        lastDataUpdate: new Date().toISOString()
      };

    case ActionTypes.SET_PHOTOS:
      return { ...state, photos: action.payload };

    case ActionTypes.ADD_PHOTO:
      return {
        ...state,
        photos: [action.payload, ...state.photos]
      };

    case ActionTypes.REMOVE_PHOTO:
      return {
        ...state,
        photos: state.photos.filter(photo => photo.id !== action.payload)
      };

    case ActionTypes.SET_SUMMARY:
      return { ...state, summary: action.payload };

    case ActionTypes.SET_PREFERENCES:
      return { ...state, preferences: { ...state.preferences, ...action.payload } };

    case ActionTypes.UPDATE_PREFERENCE:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          [action.payload.key]: action.payload.value
        }
      };

    case ActionTypes.SET_ONLINE_STATUS:
      return { ...state, isOnline: action.payload };

    case ActionTypes.SET_LAST_UPDATE:
      return { ...state, lastDataUpdate: action.payload };

    default:
      return state;
  }
};

// Create context
const AppContext = createContext();

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('trackify-preferences');
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        dispatch({ type: ActionTypes.SET_PREFERENCES, payload: preferences });
      } catch (error) {
        console.warn('Error loading preferences:', error);
      }
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('trackify-preferences', JSON.stringify(state.preferences));
  }, [state.preferences]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => dispatch({ type: ActionTypes.SET_ONLINE_STATUS, payload: true });
    const handleOffline = () => dispatch({ type: ActionTypes.SET_ONLINE_STATUS, payload: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Actions
  const actions = {
    // Loading and error management
    setLoading: (loading) => dispatch({ type: ActionTypes.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: ActionTypes.SET_ERROR, payload: error }),
    clearError: () => dispatch({ type: ActionTypes.CLEAR_ERROR }),

    // Data actions
    loadBodyCompositionData: async (params = {}) => {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        dispatch({ type: ActionTypes.CLEAR_ERROR });

        const data = await apiService.getBodyCompositionData(params);
        const transformedData = apiService.transformBodyCompositionData(data);

        dispatch({ type: ActionTypes.SET_BODY_DATA, payload: transformedData });
        return transformedData;
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },

    addBodyCompositionData: (data) => {
      dispatch({ type: ActionTypes.ADD_BODY_DATA, payload: data });
    },

    loadPhotos: async (params = {}) => {
      try {
        const photos = await apiService.getPhotos(params);
        const transformedPhotos = apiService.transformPhotosData(photos);

        dispatch({ type: ActionTypes.SET_PHOTOS, payload: transformedPhotos });
        return transformedPhotos;
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    addPhoto: (photo) => {
      const transformedPhoto = apiService.transformPhotosData([photo])[0];
      dispatch({ type: ActionTypes.ADD_PHOTO, payload: transformedPhoto });
    },

    removePhoto: async (photoId) => {
      try {
        await apiService.deletePhoto(photoId);
        dispatch({ type: ActionTypes.REMOVE_PHOTO, payload: photoId });
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    loadSummary: async () => {
      try {
        const summary = await apiService.getCachedMetricsSummary();
        dispatch({ type: ActionTypes.SET_SUMMARY, payload: summary });
        return summary;
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    // File upload actions
    uploadExcelFile: async (file) => {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        dispatch({ type: ActionTypes.CLEAR_ERROR });

        const result = await apiService.uploadExcelFile(file);

        // Refresh data after upload
        await actions.loadBodyCompositionData();
        await actions.loadSummary();

        return result;
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },

    uploadPhoto: async (file, date = null, tags = 'progress') => {
      try {
        const result = await apiService.uploadPhoto(file, date, tags);
        actions.addPhoto(result);
        return result;
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    // Preferences
    updatePreference: (key, value) => {
      dispatch({
        type: ActionTypes.UPDATE_PREFERENCE,
        payload: { key, value }
      });
    },

    setPreferences: (preferences) => {
      dispatch({ type: ActionTypes.SET_PREFERENCES, payload: preferences });
    },

    // Utility actions
    refreshAllData: async () => {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });

        // Load all data in parallel
        await Promise.all([
          actions.loadBodyCompositionData(),
          actions.loadPhotos(),
          actions.loadSummary()
        ]);

        apiService.clearCache(); // Clear cache to ensure fresh data
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },

    // Analytics actions
    getTrendAnalysis: async (startDate, endDate, metrics) => {
      try {
        return await apiService.getTrendAnalysis(startDate, endDate, metrics);
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    getProgressPredictions: async (daysAhead = 30) => {
      try {
        return await apiService.getProgressPredictions(daysAhead);
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    checkGoalProgress: async (targetWeight, targetDate) => {
      try {
        return await apiService.checkGoalProgress(targetWeight, targetDate);
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    },
  };

  // Computed values
  const computed = {
    hasData: state.bodyCompositionData.length > 0,
    hasPhotos: state.photos.length > 0,
    latestMeasurement: state.bodyCompositionData[0] || null,
    recentPhotos: state.photos.slice(0, 6),

    // Data by date ranges
    getDataByRange: (range) => {
      const { startDate } = apiService.getDateRange(range);
      const cutoffDate = new Date(startDate);

      return state.bodyCompositionData.filter(
        record => record.date >= cutoffDate
      );
    },

    // Get specific metrics
    getMetricData: (metric, range = 'month') => {
      const data = computed.getDataByRange(range);
      return data.map(record => ({
        date: record.date,
        value: record[metric],
        displayDate: record.displayDate
      })).reverse(); // Chronological order for charts
    },

    // Photo timeline
    getPhotoTimeline: () => {
      const timeline = {};
      state.photos.forEach(photo => {
        const monthKey = photo.date.toISOString().slice(0, 7); // YYYY-MM
        if (!timeline[monthKey]) {
          timeline[monthKey] = [];
        }
        timeline[monthKey].push(photo);
      });
      return timeline;
    },

    // Check if data needs refresh (older than 5 minutes)
    needsDataRefresh: () => {
      if (!state.lastDataUpdate) return true;
      const lastUpdate = new Date(state.lastDataUpdate);
      const now = new Date();
      return (now - lastUpdate) > 5 * 60 * 1000; // 5 minutes
    },
  };

  const value = {
    ...state,
    actions,
    computed,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// HOC for components that need app context
export const withAppContext = (Component) => {
  return function WrappedComponent(props) {
    return (
      <AppProvider>
        <Component {...props} />
      </AppProvider>
    );
  };
};

export default AppContext;