import {createStore, combineReducers, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import { configureStore } from '@reduxjs/toolkit'

import { ordersReducer, themeReducer } from './Reducers';

const rootReducer = combineReducers({ordersReducer, themeReducer});

export const store = createStore(rootReducer, applyMiddleware(thunk));