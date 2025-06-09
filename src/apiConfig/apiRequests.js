import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { removeData } from "../helpers/storage";
import eventEmitter from "../utils/EventEmitter";
import { getSecureData } from '../helpers/storage';
import NetInfo from '@react-native-community/netinfo';

const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;
const RETRY_DELAY = 2000;  // Increased from 1000
const MAX_RETRIES = 5;     // Increased from 3
const INITIAL_TIMEOUT = 15000; // Increased from 10000

const axiosInstance = axios.create({
  timeout: INITIAL_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Clear expired cache entries
const clearCache = () => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.delete(key);
    }
  }
};

setInterval(clearCache, CACHE_DURATION);

const checkInternetConnection = async () => {
  const netInfo = await NetInfo.fetch();
  return netInfo.isConnected && netInfo.isInternetReachable;
};

const handleApiError = (error, dictionary) => {
  let errorType = 'UNKNOWN';
  let errorMessage = '';
  let statusCode = error.response?.status;

  // Add detailed network error logging
  if (!error.response && (error.code === 'ERR_NETWORK' || error.message.includes('Network Error'))) {
    console.error('Detailed Network Error:', {
      errorCode: error.code,
      errorMessage: error.message,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout,
      },
      timestamp: new Date().toISOString(),
    });

    // Check current network state
    NetInfo.fetch().then(state => {
      console.log('Network State:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        details: state.details,
      });
    });

    errorType = 'NETWORK_ERROR';
    errorMessage = dictionary?.['errors.NETWORK_ERROR'] || 'ქსელთან კავშირის პრობლემა';
  } else if (!error.response && error.code === 'ECONNABORTED') {
    errorType = 'REQUEST_TIMEOUT';
    errorMessage = dictionary?.['errors.REQUEST_TIMEOUT'] || 'მოთხოვნის დრო ამოიწურა';
  } else if (error.response) {
    switch (statusCode) {
      case 400:
        errorType = 'BAD_REQUEST';
        break;
      case 401:
        errorType = 'UNAUTHORIZED';
        break;
      case 403:
        errorType = 'FORBIDDEN';
        break;
      case 404:
        errorType = 'NOT_FOUND';
        break;
      case 422:
        errorType = 'VALIDATION_ERROR';
        break;
      case 500:
        errorType = 'SERVER_ERROR';
        break;
      case 502:
        errorType = error.config?.url?.includes('ngrok') ? 'NGROK_ERROR' : 'BAD_GATEWAY';
        break;
      case 503:
        errorType = 'SERVICE_UNAVAILABLE';
        break;
      default:
        if (error.response?.data?.error) {
          errorType = 'API_ERROR';
          errorMessage = error.response.data.error;
        }
    }
  }

  // Use translated message if available
  errorMessage = dictionary?.[`errors.${errorType}`] || errorMessage || dictionary?.['errors.UNKNOWN'] || 'An error occurred';
  // Show error toast
  eventEmitter.emit('showToast', {
    type: 'failed',
    title: dictionary ? dictionary["info.warning"] : 'Error',
    message: errorMessage
  });

  return {
    type: errorType,
    message: errorMessage,
    statusCode,
    originalError: error
  };
};

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      // Check internet connection before making request
      const isConnected = await checkInternetConnection();
      if (!isConnected) {
        throw new Error('No internet connection');
      }

      const token = await getSecureData('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    if (response.config.method === 'get') {
      const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log detailed error information
    console.error('API Error:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    // Get current dictionary from the LanguageContext
    let dictionary = null;
    try {
      const languageContext = global.languageContext;
      if (languageContext) {
        dictionary = languageContext.dictionary;
      }
    } catch (e) {
      console.warn('Could not access language context:', e);
    }

    // Handle specific error cases
    if (error.response?.status === 401) {      try {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
        eventEmitter.emit('sessionExpired');
      } catch (e) {
        console.error('Error clearing auth data:', e);
      }
      return Promise.reject(handleApiError(error, dictionary));
    }

    // Enhanced retry logic
    if (originalRequest && (!error.response || error.response.status >= 500 || error.code === 'ECONNABORTED' || error.message.includes('Network Error'))) {
      originalRequest._retry = (originalRequest._retry || 0) + 1;
      
      if (originalRequest._retry <= MAX_RETRIES) {
        console.log(`Retrying request (${originalRequest._retry}/${MAX_RETRIES})...`);
        
        // Check internet connection before retry
        const isConnected = await checkInternetConnection();
        if (!isConnected) {
          console.log('No internet connection, waiting before retry...');
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * 2));
        }

        // Exponential backoff for retries
        const delay = RETRY_DELAY * Math.pow(2, originalRequest._retry - 1);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Increase timeout for retries
        originalRequest.timeout = INITIAL_TIMEOUT * Math.pow(1.5, originalRequest._retry);
        
        return axiosInstance(originalRequest);
      }
    }

    const formattedError = handleApiError(error, dictionary);
    return Promise.reject(formattedError);
  }
);

export default axiosInstance;
