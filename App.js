import React, { useState, useEffect } from 'react';
import { StyleSheet, Button, View, Text, Modal } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { useNetInfo } from '@react-native-community/netinfo';
import { useKeepAwake } from 'expo-keep-awake';

import Main from './src/Main';
import Toast from './src/components/generate/Toast';

// Sentry initialization
Sentry.init({
  dsn: 'https://2ae499816c71fe2e649d2d50a9fe6f9c@o4506904411439104.ingest.us.sentry.io/4506904415764480',
  enableInExpoDevelopment: false, // Disable in development if needed
  environment: Updates.releaseChannel || 'development', // Track environment
  release: Updates.manifest?.version
});

// Error fallback component for crashes
const ErrorFallback = () => (
  <View style={styles.errorFallback}>
    <Text style={styles.errorFallbackText}>
      Oops! Something went wrong. Please try again later.
    </Text>
    <Button title="Reload App" onPress={() => Updates.reloadAsync()} />
  </View>
);

// Enhanced ErrorBoundary using Sentry
const ErrorBoundary = Sentry.withErrorBoundary(({ children }) => <>{children}</>, {
  fallback: <ErrorFallback />,
});

function App() {
  const [isConnected, setIsConnected] = useState(true);
  const [showReloadButton, setShowReloadButton] = useState(false);
  const netInfo = useNetInfo();

  // Keep the screen awake
  useKeepAwake();

  // Monitor network status
  useEffect(() => {
    setIsConnected(netInfo.isConnected);
  }, [netInfo.isConnected]);

  // Set up global error handling
  useEffect(() => {
    const handleAppCrash = () => {
      setShowReloadButton(true);
      Sentry.captureException(new Error('App crashed')); // Capture the crash in Sentry
    };

    const previousHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      if (isFatal) {
        handleAppCrash();
      } else {
        Sentry.captureException(error); // Capture non-fatal errors
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Something went wrong, but the app is still running.',
        });
      }

      if (previousHandler) {
        previousHandler(error, isFatal);
      }
    });

    return () => {
      ErrorUtils.setGlobalHandler(previousHandler);
    };
  }, []);

  // App reload handler
  const handleReload = async () => {
    try {
      if (!Updates.isEmbeddedLaunch) {
        console.warn('App reloads are not supported in Expo Go. Please build a standalone app.');
        return;
      }

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
        <Modal visible={true} transparent={true}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>
              {!isConnected ? 'Connection Error' : 'App has crashed'}
            </Text>
            <Button title="Reload App" onPress={handleReload} />
          </View>
        </Modal>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 15,
  },
  errorFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorFallbackText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default Sentry.wrap(App);
