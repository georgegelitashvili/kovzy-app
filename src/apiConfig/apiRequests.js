import axios from "axios";
import * as SecureStore from 'expo-secure-store';
import { removeData } from "../helpers/storage";

// ქეშის ობიექტი
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 წუთი

const axiosInstance = axios.create({
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000, // 10 წამი
});

// ქეშის გასუფთავების ფუნქცია
const clearCache = () => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.delete(key);
    }
  }
};

// ქეშის გასუფთავება ყოველ 5 წუთში
setInterval(clearCache, CACHE_DURATION);

// Request interceptor to check for empty URLs
axiosInstance.interceptors.request.use(
  async (config) => {
    // Check if the URL is empty or undefined
    if (!config.url || config.url.trim() === '') {
      console.error('Request URL is empty or invalid');
      return Promise.reject(new Error('Invalid request URL'));
    }

    // Add Authorization token if available
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${JSON.parse(token)}`;
    }

    // ქეშის შემოწმება GET მოთხოვნებისთვის
    if (config.method === 'get') {
      const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
      const cachedData = cache.get(cacheKey);
      
      if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
        return Promise.reject({
          config,
          response: { data: cachedData.data }
        });
      }
    }

    return config;
  },
  (error) => {
    console.error("Interceptor error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor to handle responses and errors
axiosInstance.interceptors.response.use(
  (response) => {
    // ქეშის შენახვა GET მოთხოვნებისთვის
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
  (error) => {
    // Handle response errors
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
