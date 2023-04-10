import {ActionTypes} from './ActionTypes';


const initialState = {
  isLoggingIn: false,
  isAuthenticated: false,
  loginError: [],
  branches: [],
  deliveron: [],
  isdarkTheme: false,
  ismodalOpen: false,
};

export function authReducer(state = initialState, action) {
  switch (action.type) {
    case ActionTypes.LOGIN_REQUEST:
      return {...state, isLoggingIn: action.payload, isAuthenticated: action.payload};
    case ActionTypes.LOGIN_SUCCESS:
      return {...state, isAuthenticated: action.payload, isLoggingIn: action.payload == false ? false : true};
    case ActionTypes.LOGIN_FAILURE:
      return {...state, loginError: action.payload, isLoggingIn: false, isAuthenticated: false};
    case ActionTypes.LOGOUT_REQUEST:
      return {...state, isLoggingIn: false, isAuthenticated: false};
    default:
      return state;
  }
}

export function branchesReducer(state = initialState, action) {
  switch (action.type) {
    case ActionTypes.GET_BRANCH:
      return {...state, branches: action.payload};
    default:
      return state;
  }
}

export function deliveronReducer(state = initialState, action) {
  switch (action.type) {
    case ActionTypes.GET_DELIVERON:
      return {...state, deliveron: action.payload};
    default:
      return state;
  }
}

export function themeReducer (state = initialState, action) {
    switch (action.type) {
      case ActionTypes.LIGHT_THEME:
        return {...state, isdarkTheme: action.payload };
      case ActionTypes.DARK_THEME:
        return {...state, isdarkTheme: action.payload };
      default:
        return state;
    }
};