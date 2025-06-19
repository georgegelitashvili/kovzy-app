import { useEffect } from "react";
import { Alert, Platform, Linking } from "react-native";
import Constants from "expo-constants";
import * as Updates from 'expo-updates';

/**
 * Custom hook to handle in-app updates for Android
 */
const useInAppUpdates = ({
    showLogs = false,
    onUpdateAvailable,
    onError,
    // Add Play Store URL for the app - replace with your actual app ID
    playStoreUrl = "https://play.google.com/store/apps/details?id=com.kovzy.app"
} = {}) => {
    useEffect(() => {
        // Skip updates in development, web, or non-Android platforms
        if (__DEV__ || Platform.OS === "web" || Platform.OS !== "android") {
            showLogs && console.log("Skipping updates: not on Android production build");
            return;
        }

        let channel = "production";
        try {
            if (Constants?.manifest2?.extra?.expoClient?.updates?.channel) {
                channel = Constants.manifest2.extra.expoClient.updates.channel;
            }
        } catch (e) {
            showLogs && console.log("Failed to get update channel. Using default 'production'.");
        }

        // Create a promise that resolves after a timeout to avoid blocking
        const timeoutPromise = new Promise(resolve => {
            setTimeout(() => {
                resolve({ isAvailable: false });
                showLogs && console.log("Update check timed out, continuing silently");
            }, 5000); // 5 second timeout to avoid freezing the app
        });

        // Use Promise.race to either get the update check result or timeout
        Promise.race([
            // Wrap in another Promise to catch errors at this level
            new Promise(resolve => {
                try {
                    Updates.checkForUpdateAsync()
                        .then(result => resolve(result))
                        .catch(error => {
                            showLogs && console.error("Update check error (silent):", error);
                            if (onError) onError(error);
                            resolve({ isAvailable: false });
                        });
                } catch (error) {
                    showLogs && console.error("Updates initialization error (silent):", error);
                    if (onError) onError(error);
                    resolve({ isAvailable: false });
                }
            }),
            timeoutPromise
        ])
        .then(result => {
            if (!result.isAvailable) {
                showLogs && console.log("No updates available");
                return;
            }

            // If custom handler is provided, let it handle the update
            if (onUpdateAvailable) {
                onUpdateAvailable();
                return;
            }

            // Show alert to direct user to Play Store instead of OTA update
            Alert.alert(
                "Update Available",
                "A new version of the app is available. Would you like to update now?",
                [
                    {
                        text: "Update",
                        isPreferred: true,
                        onPress() {
                            try {
                                // Open Play Store instead of trying OTA update
                                Linking.openURL(playStoreUrl).catch(err => {
                                    showLogs && console.error("Failed to open Play Store:", err);
                                });
                            } catch (error) {
                                showLogs && console.error("Linking error (silent):", error);
                                if (onError) onError(error);
                            }
                        },
                    },
                    { text: "Cancel" },
                ]
            );
        })
        .catch(error => {
            // This should not happen since we're already catching errors above
            // But just in case, we'll handle it silently
            showLogs && console.error("Unhandled update error (silent):", error);
            if (onError) onError(error);
        });
    }, [showLogs, onUpdateAvailable, onError, playStoreUrl]);
};

/**
 * AppUpdates Component
 * Handles automatic updates for Android applications by directing users to the Play Store
 * Designed to fail gracefully without crashing or freezing the app
 */
export default function AppUpdates({
    showLogs = false,
    onUpdateAvailable,
    onError,
    playStoreUrl
}) {
    useInAppUpdates({ 
        showLogs, 
        onUpdateAvailable, 
        onError,
        playStoreUrl
    });
    return null;
}
