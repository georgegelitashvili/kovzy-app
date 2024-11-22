import axios from "axios";
import * as SecureStore from 'expo-secure-store';
import { removeData } from "../helpers/storage";

const axiosInstance = axios.create({
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

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

    return config;
  },
  (error) => {
    console.error("Interceptor error:", error);
    return Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  (response) => {
    // Clear cache for this specific request
    response.config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    response.config.headers['Pragma'] = 'no-cache';
    response.config.headers['Expires'] = 0;

    return response;
  },
  (error) => {
    console.error("Error axiosInstance:", error);
    if (error?.response && error?.response.status === 404) {
      // Handle not found error
      removeData("domain");
      removeData("branch");
      removeData("branchName");
      removeData("user");
    } else {
      // Handle other types of errors (e.g., network errors)
      console.error("An error occurred (axios):", error.message);
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
