import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Button, View, Text, Modal, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { useNetInfo } from '@react-native-community/netinfo';
import { useKeepAwake } from 'expo-keep-awake';

import Main from './src/Main';
import { ToastManager } from './src/utils/NotificationManager';
import ErrorWrapper from './src/components/generate/ErrorWrapper';
import useErrorHandler from './src/hooks/useErrorHandler';
import eventEmitter from './src/utils/EventEmitter';

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
  const { error, setError, clearError, setApiError } = useErrorHandler();
  const errorHandlerRef = useRef({ setError, clearError, setApiError });

  // Keep the screen awake
  useKeepAwake();

  // Monitor network status
  useEffect(() => {
    setIsConnected(netInfo.isConnected);
    
    // Show network status toast only if it changes to disconnected
    if (netInfo.isConnected === false) {
      eventEmitter.emit('showToast', {
        type: 'failed',
        title: 'Connection Error',
        subtitle: 'Oops, Looks like your device is not connected to the internet'
      });
    }
  }, [netInfo.isConnected]);

  // Update checker
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          Updates.reloadAsync();
        }
      } catch (error) {
        // Don't show update errors to user
        console.error('Error checking for updates:', error);
        Sentry.captureException(error);
      }
    };

    checkForUpdates();
  }, []);

  // Handle app reloading
  const handleReload = async () => {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      Sentry.captureException(error);
      console.error('Failed to reload app:', error);
    }
  };

  // Make error handler available globally
  useEffect(() => {
    global.errorHandler = errorHandlerRef.current;
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar
        backgroundColor="transparent"
        barStyle="dark-content"
        translucent
      />
      <ErrorBoundary>
        <ErrorWrapper>
          <Main isConnected={isConnected} />
          <ToastManager />
        </ErrorWrapper>
      </ErrorBoundary>
      
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
    fontWeight: '600',
    textAlign: 'center',
  },
  errorFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorFallbackText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  }
});

export default Sentry.wrap(App);
