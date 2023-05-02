import axios from "axios";
import { ActionTypes } from "./ActionTypes";
import { storeData, getData } from "../helpers/storage";

// Construct api headers
// const headers = {
//   'Accept': "application/json",
//   'Content-Type': "application/json",
// };

// export const checkDomain = (options) => {
//   if (options !== null || options != "undefind") {
//     try {
//       return async (dispatch) => {
//         await axios(options)
//       };
//     } catch (e) {
//       console.log(e.error);
//     }
//   }
// };

// export const getBranches = (options) => {
//   if (options !== null || options != "undefind") {
//     try {
//       return async (dispatch) => {
//         await Request(options)
//           .then((response) => {
//             dispatch({
//               type: ActionTypes.GET_BRANCH,
//               payload: response.map(item => ({label: item.title, value: item.id, enabled: item.enabled})),
//             });
//           })
//           .catch((error) => {
//             if (error.response) {
//               console.log('---------- response');
//               console.log(error.response.data);
//               console.log('---------- end response');
//             } else if (error.request) {
//               console.log('---------- request');
//               console.log(error.request);
//               console.log('---------- end request');
//             } else {
//               console.log('Error', error.message);
//             }
//             console.log(error.config);
//           });
//       };
//     } catch (e) {
//       console.log(e.message);
//     }
//   }
// };

// export const getDeliveron = (options) => {
//   if (options !== null || options != "undefind") {
//     try {
//       return async (dispatch) => {
//         await Request(options)
//           .then((response) => {
//             dispatch({
//               type: ActionTypes.GET_DELIVERON,
//               payload: response,
//             });
//           })
//           .catch((error) => console.log({ getDeliveron: error }));
//       };
//     } catch (e) {
//       console.log(e.message);
//     }
//   }
// };

// export const login = (options) => {
//   if (options !== null || options != "undefind") {
//     try {
//       return async (dispatch) => {
//         await axios(options, headers)
//           .then((response) => {
//             // console.log(response.data);
//             dispatch({
//               type: ActionTypes.LOGIN_REQUEST,
//               payload: response.data.data.authorized,
//             });
//           })
//           .catch((error) => {
//             if (error.response) {
//               dispatch({
//                 type: ActionTypes.LOGIN_FAILURE,
//                 payload: error.response.data.error.message,
//               });
//             } else if (error.request) {
//               console.log(error.request);
//             } else {
//               console.log('Error', error.message);
//             }
//             console.log(error.config);
//           });
//       };
//     } catch (e) {
//       console.log(e.message);
//     }
//   }
// };

// export const authLegal = (options) => {
//   if (options !== null || options != "undefind") {
//     try {
//       return async (dispatch) => {
//         await axios(options, headers)
//           .then((response) => {
//             dispatch({
//               type: ActionTypes.LOGIN_SUCCESS,
//               payload: response.data.authorized,
//             });
//           })
//           .catch((error) => {
//             if (error.response) {
//               console.log(error.response.data);
//             } else if (error.request) {
//               console.log(error.request);
//             } else {
//               console.log('Error', error.message);
//             }
//             console.log(error.config);
//           });
//       };
//     } catch (e) {
//       console.log(e.message);
//     }
//   }
// }


// export const logout = (options) => {
//   if (options !== null || options != "undefind") {
//     try {
//       return async (dispatch) => {
//         await axios(options, headers)
//           .then((response) => {
//             console.log('------------- logout');
//             console.log(response.data);
//             console.log('------------- end logout');
//             dispatch({
//               type: ActionTypes.LOGOUT_REQUEST,
//               payload: response.data,
//             });
//           })
//           .catch((error) => {
//             if (error.response) {
//               console.log('---------- response');
//               console.log(error.response.data);
//               console.log('---------- end response');
//               dispatch({
//                 type: ActionTypes.LOGIN_FAILURE,
//                 payload: error.response.data.error.message,
//               });
//             } else if (error.request) {
//               console.log(error.request);
//             } else {
//               console.log('Error', error.message);
//             }
//             console.log(error.config);
//           });
//       };
//     } catch (e) {
//       console.log(e.message);
//     }
//   }
// };

export const ToggleTheme = (theme) => {
  storeData("@darktheme", theme);
  return async (dispatch) => {
    if (theme === true) {
      dispatch({
        type: ActionTypes.DARK_THEME,
        payload: theme,
      });
    } else {
      dispatch({
        type: ActionTypes.LIGHT_THEME,
        payload: theme,
      });
    }
  };
};

//   other actions
