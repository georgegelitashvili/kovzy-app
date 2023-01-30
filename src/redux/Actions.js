import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ActionTypes} from './ActionTypes';

// Construct a BASE URL for API endpoint
const API_URL = 'https://fakestoreapi.com/products';
const API_KEY = 'products';
const PARAMS = 'limit=10';
const BASE_URL = `${API_URL}?${PARAMS}`;

export const getOrders = () => {
    try {
      return async dispatch => {
        const res = await axios.get(`${BASE_URL}`)
  
        if (res) {
          dispatch({
            type: ActionTypes.GET_ORDERS,
            payload: res.data,
          });
        } else {
          console.log('Unable to fetch');
        }
      };
    } catch (error) {
      // Add custom logic to handle errors
    }
  };

  // store theme value into storage
const storeData = async (value) => {
  try {
    await await AsyncStorage.setItem("@darktheme", value.toString());
  } catch (e) {
  }
}
  
export const ToggleTheme = (theme) => {
  storeData(theme);
    return async dispatch => {
        if (theme === true) {
            dispatch({
                type: ActionTypes.DARK_THEME,
                payload: theme,
            })
        } else {
            dispatch({
                type: ActionTypes.LIGHT_THEME,
                payload: theme,
            })
        }
    }
}



//   other actions
