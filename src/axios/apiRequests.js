import axios from "axios";

// Construct api config
const config = {
    headers: {
    'Accept': "application/json",
    'Content-Type' : 'application/json'
    },
    withCredentials: true
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

         return await axios(options, config)
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