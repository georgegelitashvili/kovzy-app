import axios from "axios";
import * as SecureStore from 'expo-secure-store';
import * as RootNavigation from '../helpers/navigate';
import { removeData } from "../helpers/storage";


// Construct api config
let cookie = null;

const axiosInstance = axios.create({
  headers: {
    'Accept': "application/json",
    'Content-Type' : 'application/json'
    },
    withCredentials: true,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    cookie = await SecureStore.getItemAsync('cookie');
    if (cookie) {
      config.headers['set-cookie'] = JSON.stringify(cookie);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  (response) =>{
    return response;
  },
  (error) => {
    if (error.response?.status === 404) {
      removeData("domain");
      removeData("branch");
      removeData("branchName");
      RootNavigation.navigate('Domain', { screen: 'Domain', message: 'Not allowed' });
    }

    return new Promise((resolve, reject) => {
      reject(error.response);
    });a
  },
);

export default axiosInstance;
