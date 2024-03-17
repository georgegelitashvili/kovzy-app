import React, { useState, useEffect } from 'react';
import { StyleSheet, Button, View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';
import * as Updates from 'expo-updates';
import { useNetInfo } from '@react-native-community/netinfo';

import Main from './src/Main';
import Toast from './src/components/generate/Toast';

Sentry.init({
  dsn: 'https://2ae499816c71fe2e649d2d50a9fe6f9c@o4506904411439104.ingest.us.sentry.io/4506904415764480',
  enableInExpoDevelopment: true,
});

const ErrorBoundary = Sentry.withErrorBoundary(({ children }) => children);

function App() {
  const [isConnected, setIsConnected] = useState(true);
  const [showReloadButton, setShowReloadButton] = useState(false);
  const netInfo = useNetInfo();

  useEffect(() => {
    setIsConnected(netInfo.isConnected);
  }, [netInfo.isConnected]);

  useEffect(() => {
    const handleAppCrash = () => {
      setShowReloadButton(true);
    };

    // Capture unhandled exceptions
    const previousHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      handleAppCrash();
      if (previousHandler) {
        previousHandler(error, isFatal);
      }
    });

    return () => {
      ErrorUtils.setGlobalHandler(previousHandler);
    };
  }, []);

  const handleReload = async () => {
    Sentry.captureEvent('Reloaded the app');
    await Updates.reloadAsync();
  };

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <Main />
      </ErrorBoundary>
      {!isConnected && (
        <Toast
          type="failed"
          title="Connection Error"
          subtitle="Oops, Looks like your device is not connected to the internet"
          animate={false}
        />
      )}
      {(!isConnected || showReloadButton) && (
        <View style={styles.reloadContainer}>
          <Text style={styles.reloadText}>
            {!isConnected ? 'Connection Error' : 'App has crashed'}
          </Text>
          <Button style={styles.reloadButton} title="Reload App" onPress={handleReload} />
        </View>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  reloadContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  reloadText: {
    marginBottom: 10,
  },
  reloadButton: {
    marginBottom: 10,
  }
});

export default Sentry.wrap(App);
