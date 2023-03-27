import axios from "axios";

// Construct api headers
const headers = {
    'Accept': "application/json",
    'Content-Type': "application/json",
  };


export const Request = async (options) => {
    if (options !== null || options != "undefind") {
      try {
         return await axios(options, headers)
            .then((response) => {
              const items = response.data.data;
              return items;
            })
            .catch((error) => {
              if (error.response) {
                console.log(error.response.data);
              } else if (error.request) {
                console.log(error.request);
              } else {
                console.log('Error', error.message);
              }
              console.log(error.config);
            });
      } catch (e) {
        console.log(e.message);
      }
    }
  };