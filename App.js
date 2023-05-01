import React, { useState, useEffect, useContext } from "react";
import { DevSettings, Alert } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import "react-native-gesture-handler";

import { store } from "./src/redux/Store";
import Main from "./src/Main";

export default function App() {
  const [isOffline, setOfflineStatus] = useState(false);

  useEffect(() => {
    const removeNetInfoSubscription = NetInfo.addEventListener((state) => {
      const offline = !(state.isConnected && state.isInternetReachable);
      setOfflineStatus(offline);
    });

    return () => removeNetInfoSubscription();
  }, []);

  if (isOffline) {
    Alert.alert(
      "Connection Error",
      "Oops, Looks like your device is not connected to the internet",
      [{ text: "retry", onPress: () => DevSettings.reload() }]
    );
  }

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <Main />
      </SafeAreaProvider>
    </Provider>
  );
}
