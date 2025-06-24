import { useEffect } from "react";
import { Alert, Platform, Linking } from "react-native";
import Constants from "expo-constants";
import * as Updates from "expo-updates";

/**
 * Custom hook to handle in-app updates for Android
 */
const useInAppUpdates = ({
    showLogs = false,
    onUpdateAvailable,
    onError,
    playStoreUrl = "https://play.google.com/store/apps/details?id=com.kovzy.app"
} = {}) => {
    useEffect(() => {
        if (__DEV__) {
            showLogs && console.log("⏭ Skipping update check in dev mode");
            return;
        }

        if (Platform.OS !== "android") {
            showLogs && console.log("⏭ Not Android, skipping update check");
            return;
        }

        if (!Updates || typeof Updates.checkForUpdateAsync !== "function") {
            showLogs && console.log("❌ expo-updates not available");
            return;
        }

        (async () => {
            try {
                const timeout = new Promise(resolve =>
                    setTimeout(() => {
                        showLogs && console.log("⏱ Timeout reached, skipping update");
                        resolve({ isAvailable: false });
                    }, 5000)
                );

                const updateResult = await Promise.race([
                    Updates.checkForUpdateAsync(),
                    timeout
                ]);

                if (!updateResult?.isAvailable) {
                    showLogs && console.log("✅ No updates available");
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
                            onPress: () => {
                                try {
                                    Linking.openURL(playStoreUrl).catch(err => {
                                        showLogs && console.error("🔗 Failed to open Play Store", err);
                                        if (onError) onError(err);
                                    });
                                } catch (error) {
                                    showLogs && console.error("🔗 Linking error", error);
                                    if (onError) onError(error);
                                }
                            }
                        },
                        { text: "Cancel", style: "cancel" }
                    ]
                );

            } catch (err) {
                showLogs && console.error("🔥 Unexpected update error", err);
                if (onError) onError(err);
            }
        })();
    }, [showLogs, onUpdateAvailable, onError, playStoreUrl]);
};

/**
 * AppUpdates Component
 */
export default function AppUpdates({
    showLogs = false,
    onUpdateAvailable,
    onError,
    playStoreUrl
}) {
    useInAppUpdates({ showLogs, onUpdateAvailable, onError, playStoreUrl });
    return null;
}
