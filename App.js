import React, { useState, useEffect, useContext } from "react";
import * as Updates from "expo-updates";
import { StyleSheet, Alert, Linking } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from './src/components/generate/Toast';
import NetInfo from "@react-native-community/netinfo";
import "react-native-gesture-handler";

import Main from "./src/Main";
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://2ae499816c71fe2e649d2d50a9fe6f9c@o4506904411439104.ingest.us.sentry.io/4506904415764480',
  enableInExpoDevelopment: true, // Enable Sentry in Expo development mode
  debug: true, // Enable debug mode
});

function App() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const removeSubscription = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return () => {removeSubscription()};
  }, []);

  useEffect(() => {
    async function checkForUpdates() {
      try {
        const { isAvailable } = await Updates.checkForUpdateAsync();
        if (isAvailable) {
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
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    }

    checkForUpdates();
  }, []);


  return (
    <SafeAreaProvider style={styles.container}>
      <Main />
      {!isConnected ? (<Toast
        type="failed"
        title="Connection Error"
        subtitle="Oops, Looks like your device is not connected to the internet"
        animate={false}
      />) : null}
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(App);


const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative"
  },
});