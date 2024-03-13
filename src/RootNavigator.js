import React, { useContext, useState, useEffect } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import * as SecureStore from "expo-secure-store";
import { AuthContext } from "./context/AuthProvider";
import { HomeNavigator, AuthNavigator } from "./components/Stack";
import DrawerContent from "./components/DrawerContent";
import { LanguageContext } from "./components/Language";
import Loader from "./components/generate/loader";

const Drawer = createDrawerNavigator();

export default function RootNavigator() {
  const { user, setUser, deleteItem, intervalId } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const { dictionary } = useContext(LanguageContext);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const cookie = await SecureStore.getItemAsync("cookie");
        if (cookie) {
          setUser(cookie);
        } else {
          deleteItem("cookie");
          deleteItem("credentials");
          setUser(null);
        }
      } catch (error) {
        console.error("Error loading user:", error);
        // Handle error loading user data
      } finally {
        setIsLoading(false);
      }
    };

    if (intervalId) {
      clearInterval(intervalId);
    }

    if (!user) {
      loadUser();
    } else {
      setIsLoading(false);
    }
  }, [user, setUser]);

  if (isLoading) {
    return <Loader text={dictionary["loading"]} />;
  }

  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
    >
      {user ? (
        <>
          <Drawer.Screen
            name="Orders"
            options={{ headerTitle: dictionary["nav.onlineOrders"] }}
            component={HomeNavigator}
          />
          <Drawer.Screen
            name="Products"
            options={{ headerTitle: dictionary["nav.products"] }}
            component={HomeNavigator}
          />
        </>
      ) : (
          <Drawer.Screen
            name="Start"
            options={{ headerShown: false }}
            component={AuthNavigator}
          />
      )}
    </Drawer.Navigator>
  );
}
