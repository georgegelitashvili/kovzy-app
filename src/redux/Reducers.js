import AsyncStorage from '@react-native-async-storage/async-storage';
import {ActionTypes} from './ActionTypes';

const getData = async () => {
  try {
    const value = await AsyncStorage.getItem("@darktheme");
    if(value !== null) {
      return value;
    }
  } catch(e) {
  }
}

const initialState = {
  orders: [],
  isdarkTheme: getData() == 'undefind' ? getData() : false,
  ismodalOpen: false,
};

export function ordersReducer(state = initialState, action) {
  switch (action.type) {
    case ActionTypes.GET_ORDERS:
      return {...state, orders: action.payload};
    default:
      return state;
  }
}

export function themeReducer (state = initialState, action) {
    switch (action.type) {
        case ActionTypes.DARK_THEME:
            return {...state, isdarkTheme: action.payload };
        case ActionTypes.LIGHT_THEME:
          return {...state, isdarkTheme: action.payload };
        default:
            return state;
    }
};