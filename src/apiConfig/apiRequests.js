import axios from "axios";
import * as SecureStore from 'expo-secure-store';
import { removeData } from "../helpers/storage";


const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

const RETRY_DELAY = 1000;
const MAX_RETRIES = 3;

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const axiosInstance = axios.create({
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000,
});

const clearCache = () => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.delete(key);
    }
  }
};

setInterval(clearCache, CACHE_DURATION);

// Request interceptor to check for empty URLs
axiosInstance.interceptors.request.use(
  async (config) => {
    // Check if the URL is empty or undefined
    if (!config.url || config.url.trim() === '') {
      console.error('Request URL is empty or invalid');
      return Promise.reject(new Error('Invalid request URL'));
    }

    config.retryCount = config.retryCount || 0;

    // Add Authorization token if available
    const token = await SecureStore.getItemAsync('token');
    
    if (token) {
      try {
        const parsedToken = JSON.parse(token);
        config.headers.Authorization = `Bearer ${parsedToken}`;
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    } else {
      console.log('No token found in interceptor');
    }

    if (config.method === 'get') {
      const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
      const cachedData = cache.get(cacheKey);
      
      if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
        console.log('Using cached data for:', cacheKey);
        return Promise.reject({
          config,
          response: { data: cachedData.data }
        });
      }
    }

    return config;
  },
  (error) => {
    // console.error("Request interceptor error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor to handle responses and errors
axiosInstance.interceptors.response.use(
  (response) => {
    // console.log('Response interceptor - Success:', {
    //   url: response.config.url,
    //   status: response.status,
    //   statusText: response.statusText,
    //   data: response.data
    // });

    if (response.config.method === 'get') {
      const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    }

    // Clear cache for this specific request
    response.config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    response.config.headers['Pragma'] = 'no-cache';
    response.config.headers['Expires'] = 0;

    return response;
  },
  async (error) => {
    const { config } = error;
    
    if ((error.message === 'Network Error' || error.code === 'ECONNABORTED') && 
        config && config.retryCount < MAX_RETRIES) {
      
      config.retryCount = config.retryCount + 1;
      
      console.log(`მოთხოვნის ხელახალი მცდელობა ${config.retryCount}/${MAX_RETRIES}:`, config.url);
      
      await wait(RETRY_DELAY * config.retryCount);
      
      return axiosInstance(config);
    }

    if (error.response) {
      console.error('Response error:', error.response);
    } else if (error.request) {
      console.error('Request error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  },
);

export default axiosInstance;
