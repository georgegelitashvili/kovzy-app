
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import 'react-native-gesture-handler';

import {store} from './src/redux/Store';

import Main from './src/Main';

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
          <Main />
      </SafeAreaProvider>
    </Provider>
  );
}