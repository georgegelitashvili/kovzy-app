import { useEffect, useState, useRef } from 'react';
import { Alert, View, AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import axiosInstance from '../apiConfig/apiRequests';
import eventEmitter from './EventEmitter';
import Toast from '../components/generate/Toast';

const BACKGROUND_NOTIFICATION_TASK = 'background-notification-task';
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        priority: Notifications.AndroidNotificationPriority.HIGH
    }),
});

// Class to manage toast notifications
class ToastNotificationManager {
  static listeners = [];

  static showToast({ type, title, subtitle, duration }) {
    eventEmitter.emit('showToast', {
      type: type || 'info', 
      title: title || 'Notification', 
      subtitle: subtitle || '',
      duration: duration || (type === 'failed' ? 5000 : 3000)
    });
  }

  static addListener(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

// React component that displays toasts
export const ToastManager = () => {
  const [toasts, setToasts] = useState([]);
  const toastIdCounter = useRef(0);
  
  useEffect(() => {
    // Listen for toast events
    const listenerId = eventEmitter.addEventListener('showToast', (toastData) => {
      // Create a unique ID for this toast
      const newToast = {
        ...toastData,
        id: toastIdCounter.current++,
        animate: true
      };
      
      // Add the new toast to the stack
      setToasts(currentToasts => [...currentToasts, newToast]);
      
      // Automatically remove toast after its duration
      const duration = toastData.duration || (toastData.type === 'failed' ? 5000 : 3000);
      setTimeout(() => {
        setToasts(currentToasts => currentToasts.filter(t => t.id !== newToast.id));
      }, duration + 700); // Add extra time for animation
    });
      return () => {
      eventEmitter.removeEventListener(listenerId);
    };
  }, []);
  
  // Handle manual dismiss of a toast
  const handleDismiss = (id) => {
    setToasts(currentToasts => currentToasts.filter(t => t.id !== id));
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
    soundRef: null,
    async initialize(options, branchid, languageId, soundRef) {
        try {
            this.soundRef = soundRef;
            // Register notifications
            const token = await this.registerForPushNotificationsAsync();
            if (token) {
                await this.savePushTokenToBackend(token, options, branchid);
                console.log('Push notifications initialized.');
            }
        } catch (error) {
            console.error('Error initializing NotificationManager:', error);
            throw error;
        }
    },

    async registerForPushNotificationsAsync() {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('myNotificationChannel', {
                name: 'Default Notification Channel',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            Alert.alert('Error', 'Failed to get push token for notifications!');
            return null;
        }

        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

        if (!projectId) {
            throw new Error('Project ID not found');
        }

        const pushToken = (
            await Notifications.getExpoPushTokenAsync({
                projectId,
            })
        ).data;

        console.log('Expo Push Token:', pushToken);
        return pushToken;
    },

    async savePushTokenToBackend(token, options, branchid) {
        const deviceId = await Application.getAndroidId();
        try {
            const response = await axiosInstance.post(options?.url_pushToken, {
                token: token,
                branch_id: branchid,
                device_id: deviceId,
            });

            if (response.data?.status) {
                console.log('Push token saved to backend successfully!');
            } else {
                throw new Error('Push token was not accepted by the backend.');
            }
        } catch (error) {
            console.error('Error saving push token to backend:', error);
            throw error;
        }
    },
};

export default notificationManager;
export { ToastNotificationManager };
