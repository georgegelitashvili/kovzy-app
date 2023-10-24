import React, { useState, useEffect, useContext } from "react";
import * as Updates from "expo-updates";
import { StyleSheet, Alert, Linking } from "react-native";
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
    const checkForUpdate = async () => {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert(
          'Update Available',
          'A new version of the app is available. Do you want to update?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Update',
              onPress: async () => {
                // Perform the update
                Linking.openURL("http://play.google.com/store/apps/details?id=com.kovzy.app")
              },
            },
          ]
        );
      }
    };

    return () => { checkForUpdate() };
  }, []);


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