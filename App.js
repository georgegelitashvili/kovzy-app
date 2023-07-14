import React, { useState, useEffect, useContext } from "react";
import { StyleSheet } from "react-native";
import * as Updates from "expo-updates";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import Toast from './src/components/generate/Toast';
import NetInfo from "@react-native-community/netinfo";
import "react-native-gesture-handler";

import { store } from "./src/redux/Store";
import Main from "./src/Main";

export default function App() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const removeSubscription = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return () => {removeSubscription()};
  }, []);

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        reloadApp();
      }
    } catch (error) {
      // Handle error
    }
  };

  const reloadApp = async () => {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      // Handle error
    }
  };

  return (
    <>
    <Provider store={store}>
      <SafeAreaProvider style={styles.container}>
      <Main />
      {!isConnected ? (<Toast
        type="failed"
        title="Connection Error"
        subtitle="Oops, Looks like your device is not connected to the internet"
        animate={false}
      />) : null}
      </SafeAreaProvider>
    </Provider>
    </>

  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative"
  },
});