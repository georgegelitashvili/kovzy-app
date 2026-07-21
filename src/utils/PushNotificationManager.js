import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import axiosInstance from '../apiConfig/apiRequests';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

const pushNotificationManager = {
  soundRef: null,

  async initialize(options, branchid, soundRef) {
    this.soundRef = soundRef;

    const token = await this.registerForPushNotificationsAsync();
    if (token) {
      await this.savePushTokenToBackend(token, options, branchid);
      console.log('Push notifications initialized.');
    }
  },

  async registerForPushNotificationsAsync() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('kovzyOrders', {
        name: 'kovzyOrders',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'plucky.mp3',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#ffffff',
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
    const response = await axiosInstance.post(options?.url_pushToken, {
      token,
      branch_id: branchid,
      device_id: deviceId,
    });

    if (response.data?.status) {
      console.log('Push token saved to backend successfully!');
      return;
    }

    throw new Error('Push token was not accepted by the backend.');
  },
};

export default pushNotificationManager;
