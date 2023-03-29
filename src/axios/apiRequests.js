import axios from "axios";

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
            return response;
          },
          error => {
            if (error.response.status === 401) {
              // handle 401 error here
              console.log('Unauthorized');
              return null;
            }
            return Promise.reject(error);
          }
        );

         return await axios(options, headers)
            .then((response) => {
              const items = response.data.data;
              return items;
            })
      } catch (e) {
        console.log(e.message);
      }
    }
  };