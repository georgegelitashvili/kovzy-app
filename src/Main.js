import React, { useState, useEffect, useRef } from "react";
import {
  NavigationContainer,
} from '@react-navigation/native';
import {
  Provider as PaperProvider,
} from 'react-native-paper';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from "./context/AuthProvider";
import { LanguageProvider } from './components/Language';
import { navigationRef } from './helpers/navigate';
import eventEmitter from './utils/EventEmitter';
import RootNavigator from "./RootNavigator";
import Toast from './components/generate/Toast';
import ErrorDisplay from './components/generate/ErrorDisplay';
import theme from './core/theme';

export default function Main({ isConnected }) {
  const [toastConfig, setToastConfig] = useState(null);
  const [error, setError] = useState(null);
  const toastTimeoutRef = useRef(null);
  
  useEffect(() => {
    const showToastListener = eventEmitter.addEventListener('showToast', (config) => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      setToastConfig(config);
      toastTimeoutRef.current = setTimeout(() => {
        setToastConfig(null);
      }, 3000);
    });

    const apiErrorListener = eventEmitter.addEventListener('apiError', (error) => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      setError(error);
      setToastConfig({
        type: 'failed',
        title: 'Error',
        message: error.message
      });
      toastTimeoutRef.current = setTimeout(() => {
        setToastConfig(null);
      }, 3000);
    });

    const sessionExpiredListener = eventEmitter.addEventListener('sessionExpired', () => {
      setError({
        type: 'UNAUTHORIZED',
        message: 'Your session has expired. Please log in again.'
      });
    });

    return () => {
      eventEmitter.removeEventListener(showToastListener);
      eventEmitter.removeEventListener(apiErrorListener);
      eventEmitter.removeEventListener(sessionExpiredListener);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <LanguageProvider>
          <AuthProvider isConnected={isConnected}>
            <NavigationContainer ref={navigationRef}>
              <RootNavigator />
              {/* ErrorDisplay is now handled only in RootNavigator to avoid duplicates */}
              {toastConfig && (
                <Toast
                  type={toastConfig.type}
                  title={toastConfig.title}
                  subtitle={toastConfig.message}
                  animate={true}
                />
              )}
              <StatusBar style="auto" />
            </NavigationContainer>
          </AuthProvider>
        </LanguageProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
};
