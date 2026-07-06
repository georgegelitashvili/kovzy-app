import { useEffect, useState, useRef } from 'react';
import { View } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import eventEmitter from './EventEmitter';
import Toast from '../components/generate/Toast';

// Class to manage toast notifications
class ToastNotificationManager {
  static listeners = [];

  static showToast({ type, title, subtitle, duration }) {
    eventEmitter.emit('showToast', {
      type: type || 'info',
      title: title || 'Notification',
      subtitle: subtitle || '',
      duration: duration || (type === 'failed' ? 5000 : 3000),
    });
  }

  static addListener(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}

// React component that displays toasts
export const ToastManager = () => {
  // Clear toasts when user is authorized or loginError is cleared
  try {
    // Lazy import to avoid circular dependency
    // eslint-disable-next-line
    var { useContext } = require('react');
    var { AuthContext } = require('../context/AuthProvider');
    var authCtx = useContext(AuthContext);
    useEffect(() => {
      if (authCtx && (authCtx.user || !authCtx.loginError)) {
        setToasts([]);
        if (toastLock && toastLock.current) toastLock.current = false;
      }
    }, [authCtx && authCtx.user, authCtx && authCtx.loginError]);
  } catch (e) {}
  const [toasts, setToasts] = useState([]);
  const toastIdCounter = useRef(0);
  const toastLock = useRef(false);

  useEffect(() => {
    const listenerId = eventEmitter.addEventListener('showToast', (toastData) => {
      if (toastLock.current) return;
      toastLock.current = true;

      const newToast = {
        ...toastData,
        id: toastIdCounter.current++,
        animate: true,
      };

      setToasts([]);
      setTimeout(() => setToasts([newToast]), 50);

      const duration = toastData.duration || (toastData.type === 'failed' ? 5000 : 3000);
      setTimeout(() => {
        setToasts((currentToasts) => currentToasts.filter((t) => t.id !== newToast.id));
        toastLock.current = false;
      }, duration + 800);
    });
    return () => {
      eventEmitter.removeEventListener(listenerId);
    };
  }, []);

  const handleDismiss = (id) => {
    setToasts((currentToasts) => currentToasts.filter((t) => t.id !== id));
  };

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000 }}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          subtitle={toast.subtitle}
          animate={toast.animate}
          onDismiss={() => handleDismiss(toast.id)}
        />
      ))}
    </View>
  );
};

const notificationManager = {
  async initialize(options, branchid, soundRef) {
    if (isRunningInExpoGo()) {
      console.log('Push notifications are not available in Expo Go. Use a development build to test them.');
      return;
    }

    try {
      const { default: pushNotificationManager } = await import('./PushNotificationManager');
      await pushNotificationManager.initialize(options, branchid, soundRef);
    } catch (error) {
      console.error('Error initializing NotificationManager:', error);
      throw error;
    }
  },
};

export default notificationManager;
export { ToastNotificationManager };
