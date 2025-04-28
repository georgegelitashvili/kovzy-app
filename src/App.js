import { useState, useEffect, useRef } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { EventRegister } from 'react-native-event-listeners';
import { AuthProvider } from './context/AuthProvider';
import { LanguageProvider } from './components/Language';
import RootNavigator from './RootNavigator';
import Toast from './components/generate/Toast';
import ErrorDisplay from './components/generate/ErrorDisplay';
import theme from './core/theme';
import { Provider as PaperProvider } from 'react-native-paper';

export default function App() {
  const [toastConfig, setToastConfig] = useState(null);
  const [error, setError] = useState(null);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    const showToastListener = EventRegister.addEventListener('showToast', (config) => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      setToastConfig(config);
      toastTimeoutRef.current = setTimeout(() => {
        setToastConfig(null);
      }, 3000);
    });

    const apiErrorListener = EventRegister.addEventListener('apiError', (error) => {
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

    const sessionExpiredListener = EventRegister.addEventListener('sessionExpired', () => {
      setError({
        type: 'UNAUTHORIZED',
        message: 'Your session has expired. Please log in again.'
      });
    });

    return () => {
      EventRegister.removeEventListener(showToastListener);
      EventRegister.removeEventListener(apiErrorListener);
      EventRegister.removeEventListener(sessionExpiredListener);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <LanguageProvider>
          <AuthProvider>
            <NavigationContainer>
              <RootNavigator />
              {error && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
                  <ErrorDisplay error={error} />
                </View>
              )}
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
}