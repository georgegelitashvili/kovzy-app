import axios from "axios";
import * as SecureStore from 'expo-secure-store';
import { DevSettings } from "react-native";
import * as RootNavigation from '../helpers/navigate';
import { removeData } from "../helpers/storage";


// Construct api config
  let cookie = null;
  let error = null;
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
        if(error.response.status === 404) {
          removeData("domain");
          removeData("branch");
          removeData("branchName");
          RootNavigation.navigate('Domain', { message: 'Not allowed' });
          return false;
        }else if(error.response.data.error.status === 401) {
          SecureStore.deleteItemAsync("cookie");
          SecureStore.deleteItemAsync("user");
          RootNavigation.navigate('Login', { message: 'Not authorized' });
          return false;
        }

        return error.response;
        
      } else {
        return new Promise((resolve, reject) => {
          reject(error);
        });
      }
    },
  );

export default axiosInstance;
