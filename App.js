import React, { useState, useEffect } from "react";
import { StyleSheet, Alert, Linking } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useNetInfo } from "@react-native-community/netinfo";
import * as Sentry from "@sentry/react-native";
import "react-native-gesture-handler";

import Main from "./src/Main";
import Toast from "./src/components/generate/Toast";

Sentry.init({
  dsn: 'https://2ae499816c71fe2e649d2d50a9fe6f9c@o4506904411439104.ingest.us.sentry.io/4506904415764480',
  enableInExpoDevelopment: true, // Enable Sentry in Expo development mode
});

function App() {
  const [isConnected, setIsConnected] = useState(true);
  const netInfo = useNetInfo();

  useEffect(() => {
    setIsConnected(netInfo.isConnected);
  }, [netInfo.isConnected]);

  return (
    <SafeAreaProvider style={styles.container}>
      <Main />
      {!isConnected && (
        <Toast
          type="failed"
          title="Connection Error"
          subtitle="Oops, Looks like your device is not connected to the internet"
          animate={false}
        />
      )}
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(App);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
});
