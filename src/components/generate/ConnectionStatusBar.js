import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LanguageContext } from '../Language';
import eventEmitter from '../../utils/EventEmitter';
import {
  CONNECTION_EVENTS,
  dismissConnectionBanner,
  requestConnectionRetry,
  reportConnectionSuccess,
} from '../../utils/connectionMonitor';

const ConnectionStatusBar = () => {
  const { dictionary } = useContext(LanguageContext);
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [isDeviceOffline, setIsDeviceOffline] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const retryTimeoutRef = useRef(null);

  const showBanner = useCallback(() => {
    setVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const hideBanner = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -80,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setVisible(false);
        setRetrying(false);
      }
    });
  }, [slideAnim]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline =
        state.isConnected === false || state.isInternetReachable === false;

      setIsDeviceOffline((wasOffline) => {
        if (offline) {
          showBanner();
          return true;
        }

        if (wasOffline) {
          reportConnectionSuccess();
        }
        return false;
      });
    });

    const issueListener = eventEmitter.addEventListener(
      CONNECTION_EVENTS.ISSUE,
      () => {
        showBanner();
      }
    );

    const restoredListener = eventEmitter.addEventListener(
      CONNECTION_EVENTS.RESTORED,
      () => {
        setRetrying(false);
        hideBanner();
      }
    );

    return () => {
      unsubscribe();
      eventEmitter.removeEventListener(issueListener);
      eventEmitter.removeEventListener(restoredListener);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [hideBanner, showBanner]);

  const handleRetry = useCallback(async () => {
    if (retrying) return;

    setRetrying(true);
    try {
      await NetInfo.fetch();
      requestConnectionRetry();

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      retryTimeoutRef.current = setTimeout(() => {
        setRetrying(false);
      }, 4000);
    } catch {
      setRetrying(false);
    }
  }, [retrying]);

  const handleDismiss = useCallback(() => {
    dismissConnectionBanner();
    hideBanner();
  }, [hideBanner]);

  if (!visible) return null;

  const message = isDeviceOffline
    ? dictionary?.['connection.lost'] ||
      dictionary?.['errors.NO_INTERNET'] ||
      'No internet connection. Orders may be outdated.'
    : dictionary?.['connection.issue'] ||
      'Connection problem. Orders may be outdated.';

  const retryLabel = dictionary?.['connection.retry'] || 'Retry';
  const dismissLabel = dictionary?.['connection.dismiss'] || 'Dismiss';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 8),
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.content}>
        <Text style={styles.text} numberOfLines={2}>
          {message}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.retryButton]}
            onPress={handleRetry}
            disabled={retrying}
            accessibilityRole="button"
            accessibilityLabel={retryLabel}
          >
            {retrying ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{retryLabel}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.dismissButton]}
            onPress={handleDismiss}
            accessibilityRole="button"
            accessibilityLabel={dismissLabel}
          >
            <Text style={styles.dismissText}>{dismissLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#c62828',
    paddingHorizontal: 12,
    paddingBottom: 10,
    zIndex: 9999,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  text: {
    flex: 1,
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    minWidth: 64,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  dismissButton: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  dismissText: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    fontSize: 13,
  },
});

export default ConnectionStatusBar;
