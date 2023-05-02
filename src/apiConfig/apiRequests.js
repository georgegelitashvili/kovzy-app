import axios from "axios";
import * as SecureStore from 'expo-secure-store';
import { DevSettings } from "react-native";
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
        config.headers['set-cookie'] = JSON.parse(cookie);
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
      if (!error.response.data) {
        return new Promise((resolve, reject) => {
          reject(error);
        });
      }

      if (error.response.data) {
        console.log(error.response.status);
        if(error.response.data.error.status_code === 401) {
          RootNavigation.navigate('Login', { message: 'Not authorized' });
        }else if(error.response.status === 404) {
          removeData();
          RootNavigation.navigate('Domain', { message: 'Not allowed' });
          DevSettings.reload();
        }
        return error.response.data;
      } else {
        return new Promise((resolve, reject) => {
          reject(error);
        });
      }
    },
  );

export default axiosInstance;
