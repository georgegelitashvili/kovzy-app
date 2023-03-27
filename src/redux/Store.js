import { combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { configureStore } from '@reduxjs/toolkit'

import { authReducer, branchesReducer, deliveronReducer, themeReducer } from './Reducers';

const rootReducer = combineReducers({
    authReducer,
    branchesReducer,
    deliveronReducer,
    themeReducer
});

export const store = configureStore({
    reducer: rootReducer,
    middleware: [thunk]
});