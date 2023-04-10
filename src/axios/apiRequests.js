import axios from "axios";
import { log } from "react-native-reanimated";

// Construct api headers
const headers = {
    'Accept': "application/json",
    'Content-Type': "application/json",
  };


export const Request = async (options) => {
    if (options !== null || options != "undefind") {
      try {
        axios.interceptors.response.use(
          response => {
            if(response.status === 200) {
              return response;
            }else {
              console.log(response);
            }
          },
          error => {
            if (error.response && error.response.data) {
              console.log(error.response.data);
              return Promise.reject(error);
            }
            return Promise.reject(error);
          }
        );

         return await axios(options, headers)
            .then((response) => {
              const items = response.data.data;
              return items;
            }).catch((error) => {
              if(error){
                console.log({apiRequest: error});
                return [];
              }
            })
      } catch (e) {
        console.log(e.message);
      }
    }
  };