import React, { useState, useEffect, useContext } from "react";
import { DevSettings, Alert } from "react-native";
import Toast from 'react-native-toast-message';
import NetInfo from "@react-native-community/netinfo";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import "react-native-gesture-handler";

import { store } from "./src/redux/Store";
import Main from "./src/Main";

export default function App() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const removeNetInfoSubscription = NetInfo.addEventListener((state) => {
      const connect = (state.isConnected && state.isInternetReachable);
      setIsConnected(connect);
    });

    return () => {removeNetInfoSubscription()};
  }, []);

  const checkConnection = async () => {
    const state = await NetInfo.fetch();
    setIsConnected(state.isConnected);
  }

  return (
    <>
      {
        isConnected == false ? (
          Alert.alert(
            "Connection Error",
            "Oops, Looks like your device is not connected to the internet",
            [{ text: "retry", onPress: () => checkConnection() }]
          )
        ) : (
          <Provider store={store}>
          <SafeAreaProvider>
            <Main />
          </SafeAreaProvider>
        </Provider>
        )
      }
    </>

  );
}
