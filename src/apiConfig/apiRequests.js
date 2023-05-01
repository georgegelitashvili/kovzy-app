import axios from "axios";
import * as SecureStore from 'expo-secure-store';
import { DevSettings } from "react-native";
import * as RootNavigation from '../helpers/navigate';


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
        console.log('------------------ config axios');
        console.log(JSON.parse(cookie));
        console.log('------------------ config axios');
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
      // console.log('------------------ response axios');
      // console.log(response.config);
      // console.log('------------------ end response axios');
      return response;
    },
    (error) => {
      if (!error.response.data) {
        return new Promise((resolve, reject) => {
          reject(error);
        });
      }

      if (error.response.data) {
        console.log(error.response);
        if(error.response.data.error.status_code === 401) {
          RootNavigation.navigate('Login', { message: 'Not authorized' });
          return DevSettings.reload();
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
