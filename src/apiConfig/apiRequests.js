import axios from "axios";
import * as SecureStore from 'expo-secure-store';
import * as RootNavigation from '../helpers/navigate';
import { removeData } from "../helpers/storage";


// Construct api config
let cookie = null;
  
const deleteItem = async (key) => {
  try {
    const result = await SecureStore.deleteItemAsync(key);
    if (result) {
      console.log(key + ': Secure storage item deleted successfully.');
    } else {
      console.log(key + ': Secure storage item does not exist.');
    }
  } catch (error) {
    console.log('Error occurred while deleting secure storage:', error);
  }
};

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
      // console.log("---------------------------- error api");
      // console.log(error);
      // console.log("----------------------------end error api");
      if (error.response) {
        if(error.response.status === 404) {
          removeData("domain");
          removeData("branch");
          removeData("branchName");
          RootNavigation.navigate('Domain', { message: 'Not allowed' });
        } else if(error.response.data.error.status === 401) {
          console.log(error.response.data.error);
          deleteItem("user");
          deleteItem("cookie");
          RootNavigation.navigate('Login', { message: 'Not authorized' });
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
