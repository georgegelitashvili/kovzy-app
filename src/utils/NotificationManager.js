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
  const [toasts, setToasts] = useState([]);
  const toastIdCounter = useRef(0);
  const dismissTimeoutRef = useRef(null);

  const clearDismissTimeout = () => {
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    const listenerId = eventEmitter.addEventListener('showToast', (toastData) => {
      clearDismissTimeout();

      const newToast = {
        ...toastData,
        id: toastIdCounter.current++,
        animate: true,
      };

      setToasts([newToast]);

      if (toastData.persistent) {
        return;
      }

      const duration = toastData.duration || (toastData.type === 'failed' ? 5000 : 3000);
      dismissTimeoutRef.current = setTimeout(() => {
        setToasts([]);
        dismissTimeoutRef.current = null;
      }, duration + 800);
    });

    const dismissListenerId = eventEmitter.addEventListener('dismissToast', () => {
      clearDismissTimeout();
      setToasts([]);
    });

    return () => {
      clearDismissTimeout();
      eventEmitter.removeEventListener(listenerId);
      eventEmitter.removeEventListener(dismissListenerId);
    };
  }, []);

  const handleDismiss = (id) => {
    setToasts((currentToasts) => currentToasts.filter((t) => t.id !== id));
  };

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999, elevation: 9999 }} pointerEvents="box-none">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          subtitle={toast.subtitle}
          animate={toast.animate}
          persistent={toast.persistent}
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
