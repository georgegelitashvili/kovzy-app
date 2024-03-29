import axios from "axios";
import * as SecureStore from 'expo-secure-store';
import { navigate } from '../helpers/navigate';
import { removeData } from "../helpers/storage";

let cookie = null;

const axiosInstance = axios.create({
  headers: {
    'Accept': "application/json",
    'Content-Type': 'application/json'
  },
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    cookie = await SecureStore.getItemAsync('cookie');
    if (cookie) {
      config.headers['Cookie'] = cookie;
    }

    return config;
  },
  (error) => {
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
    console.log("Error axiosInstance:", error);
    if (error.response?.status === 404) {
      removeData("domain");
      removeData("branch");
      removeData("branchName");
      navigate('Domain', { screen: 'Domain', message: 'Not allowed' });
    }

    return Promise.reject(error.response);
  },
);

export default axiosInstance;
