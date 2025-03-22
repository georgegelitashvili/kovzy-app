import { useEffect } from "react";
import { Alert, Platform } from "react-native";
import Constants from "expo-constants";

/**
 * Custom hook to handle in-app updates for Android
 * @param {Object} options - Configuration options
 * @param {boolean} options.showLogs - Whether to show console logs
 * @param {function} options.onUpdateAvailable - Callback when update is available
 * @param {function} options.onError - Callback when error occurs
 */
const useInAppUpdates = ({ 
    showLogs = false,
    onUpdateAvailable,
    onError
} = {}) => {
    useEffect(() => {
        // Skip updates in development, web, or non-Android platforms
        if (__DEV__ || Platform.OS === "web" || Platform.OS !== "android") {
            showLogs && console.log("Skipping updates: not on Android production build");
            return;
        }

        const channel = Constants.expoConfig?.extra?.eas?.projectId
            ? (Constants.manifest2?.extra?.expoClient?.updates?.channel || "production")
            : "production";

        showLogs && console.log(`Checking for updates on channel: ${channel}`);

        import("expo-in-app-updates")
            .then(({ default: ExpoInAppUpdates }) => {
                ExpoInAppUpdates.checkForUpdate()
                    .then(({ isAvailable }) => {
                        if (!isAvailable) {
                            showLogs && console.log("No updates available");
                            return;
                        }

                        if (onUpdateAvailable) {
                            onUpdateAvailable();
                            return;
                        }

                        Alert.alert(
                            "Update Available",
                            "A new version of the app is available. Would you like to update now?",
                            [
                                {
                                    text: "Update",
                                    isPreferred: true,
                                    async onPress() {
                                        try {
                                            await ExpoInAppUpdates.startUpdate();
                                        } catch (error) {
                                            const errorMessage = "Failed to start the update. Please try again later.";
                                            Alert.alert("Error", errorMessage);
                                            console.error("Update error:", error);
                                            onError?.(error);
                                        }
                                    },
                                },
                                { text: "Cancel" },
                            ]
                        );
                    })
                    .catch((error) => {
                        const errorMessage = "Unable to check for updates at this time.";
                        console.error("Failed to check for updates:", error);
                        Alert.alert("Error", errorMessage);
                        onError?.(error);
                    });
            })
            .catch((error) => {
                console.error("expo-in-app-updates initialization failed:", error);
                onError?.(error);
            });
    }, [showLogs, onUpdateAvailable, onError]);
};

/**
 * AppUpdates Component
 * Handles automatic updates for Android applications
 * 
 * @example
 * // Basic usage
 * <AppUpdates />
 * 
 * // With custom handlers
 * <AppUpdates 
 *   showLogs={true}
 *   onUpdateAvailable={() => console.log("Update available!")}
 *   onError={(error) => console.error(error)}
 * />
 */
export default function AppUpdates({ 
    showLogs = false,
    onUpdateAvailable,
    onError 
}) {
    useInAppUpdates({ showLogs, onUpdateAvailable, onError });
    return null;
}
