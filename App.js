import React, { useState, useEffect } from 'react';
import { StyleSheet, Button, View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';
import * as Updates from 'expo-updates';
import { useNetInfo } from '@react-native-community/netinfo';

import Main from './src/Main';
import Toast from './src/components/generate/Toast';

// Sentry initialization with environment-specific settings
Sentry.init({
  dsn: process.env.SENTRY_DSN || 'https://2ae499816c71fe2e649d2d50a9fe6f9c@o4506904411439104.ingest.us.sentry.io/4506904415764480',
  enableInExpoDevelopment: false, // Disable in development if needed
  environment: Updates.releaseChannel || 'development', // Track environment
  release: Updates.manifest.version, // Track release version
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
      Sentry.captureException(new Error('App crashed')); // Capture the crash in Sentry
      handleReload(); // Reload the app
    };

    const previousHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      if (isFatal) {
        handleAppCrash();
      } else {
        Sentry.captureException(error); // Capture non-fatal errors in Sentry
      }

      if (previousHandler) {
        previousHandler(error, isFatal);
      }
    });

    return () => {
      ErrorUtils.setGlobalHandler(previousHandler);
    };
  }, []);

  const handleReload = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        Sentry.captureMessage('App Updated and Reloaded');
        await Updates.reloadAsync();
      } else {
        Sentry.captureMessage('App Reload Triggered without Update');
        await Updates.reloadAsync();
      }
    } catch (error) {
      Sentry.captureException(error);
      console.error('Failed to reload app:', error);
    }
  };

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <Main isConnected={isConnected} />
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
          <Button title="Reload App" onPress={handleReload} />
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
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Sentry.wrap(App);
