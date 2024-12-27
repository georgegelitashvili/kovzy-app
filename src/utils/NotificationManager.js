import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import { Alert, Platform } from 'react-native';
import axiosInstance from '../apiConfig/apiRequests'; // Adjust this import based on your project structure

const BACKGROUND_NOTIFICATION_TASK = 'background-notification-task';

const NotificationManager = {
    async initialize(options, type, branchid, languageId, NotificationSoundRef) {
        try {
            // Register notifications
            const token = await this.registerForPushNotificationsAsync();
            if (token) {
                await this.savePushTokenToBackend(token, options, branchid);
                console.log('Push notifications initialized.');
            }

            // Register dynamic background task
            await this.registerBackgroundTask({
                fetchUrl: options.url_unansweredOrders,
                type,
                branchid,
                languageId,
                NotificationSoundRef,
            });
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

    async registerBackgroundTask({ fetchUrl, type, branchid, languageId, NotificationSoundRef }) {
        TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
            const startTime = Date.now();
            const appState = AppState.currentState; // Check app state

            if (appState === 'active') {
                console.log('App is in the foreground. Skipping background fetch.');
                return BackgroundFetch.BackgroundFetchResult.NoData;
            }
            console.log(`Background fetch started at: ${new Date(startTime).toISOString()}`);

            try {
                const response = await axiosInstance.post(fetchUrl, {
                    type: type,
                    page: 1,
                    branchid: branchid,
                    Languageid: languageId,
                    postponeOrder: false,
                });

                const endTime = Date.now();
                const executionTime = endTime - startTime;

                const orderCount = Object.keys(response.data.data).length;
                console.log(`Background fetch completed in ${executionTime}ms`);

                if (orderCount > 0) {
                    await NotificationSoundRef?.current?.orderReceived();
                    console.log(`Found ${orderCount} new orders`);
                    return BackgroundFetch.BackgroundFetchResult.NewData;
                }

                console.log('No new orders found');
                return BackgroundFetch.BackgroundFetchResult.NoData;
            } catch (error) {
                console.error('Error during background fetch:', error);
                return BackgroundFetch.BackgroundFetchResult.Failed;
            }
        });

        try {
            await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
                minimumInterval: 30, // interval in seconds
                stopOnTerminate: false,
                startOnBoot: true,
            });

            console.log('Background task registered successfully.');
        } catch (error) {
            console.error('Failed to register background task:', error);
            throw error;
        }
    },

    async unregisterBackgroundTask() {
        try {
            await BackgroundFetch.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
            console.log('Background task unregistered.');
        } catch (error) {
            console.error('Error unregistering background task:', error);
        }
    },
};

export default NotificationManager;
