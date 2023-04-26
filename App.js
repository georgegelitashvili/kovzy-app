
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import NetInfo from "@react-native-community/netinfo";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import 'react-native-gesture-handler';

import {store} from './src/redux/Store';

import Main from './src/Main';

export default function App() {
  NetInfo.fetch().then(isConnected => {
    if(isConnected)
    {
        console.log('Internet is connected');
    }
  })

  return (
    <Provider store={store}>
      <SafeAreaProvider>
          <Main />
      </SafeAreaProvider>
    </Provider>
  );
}