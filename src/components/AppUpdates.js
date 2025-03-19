import { useEffect } from "react";
import { Alert, Platform, Text, View } from "react-native";

const useInAppUpdates = () => {
    useEffect(() => {
        if (__DEV__ || Platform.OS === "web") {
            console.log("Skipping updates in development or web.");
            return;
        } // Prevent updates in Expo Go and web

        // Dynamically import expo-in-app-updates to prevent crashes
        import("expo-in-app-updates")
            .then((ExpoInAppUpdates) => {
                if (Platform.OS === "android") {
                    ExpoInAppUpdates.checkAndStartUpdate(false);
                } else {
                    ExpoInAppUpdates.checkForUpdate().then(({ updateAvailable }) => {
                        if (!updateAvailable) return;

                        Alert.alert(
                            "Update available",
                            "A new version of the app is available with many improvements and bug fixes. Would you like to update now?",
                            [
                                {
                                    text: "Update",
                                    isPreferred: true,
                                    async onPress() {
                                        await ExpoInAppUpdates.startUpdate();
                                    },
                                },
                                { text: "Cancel" },
                            ]
                        );
                    });
                }
            })
            .catch((error) => {
                console.log("expo-in-app-updates is not available in Expo Go", error);
            });
    }, []);
};

export default function AppUpdates() {
    // Use this hook in your root app or root layout component
    useInAppUpdates();

    return (
        <View>
            <Text>Native in-app updates for Android and iOS</Text>
        </View>
    );
}
