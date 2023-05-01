import React, { useContext, useState, useEffect } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import * as SecureStore from "expo-secure-store";
import Loader from "./components/generate/loader";
import { AuthContext, AuthProvider } from "./context/AuthProvider";
import { HomeNavigator, AuthNavigator } from "./components/Stack";
import DrawerContent from "./components/DrawerContent";
import { String, LanguageContext } from "./components/Language";

const Drawer = createDrawerNavigator();

export default function RootNavigator() {
  const [isLoading, setIsLoading] = useState(true);

  const { user, setUser, domain, branchid } = useContext(AuthContext);
  const { dictionary } = useContext(LanguageContext);

  useEffect(() => {
    SecureStore.getItemAsync("user").then((user) => {
      console.log("-------------- user");
      console.log(user);
      console.log("--------------end user");
      if (user) {
        setUser(user);
      }
      
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return <Loader text="loading" />;
  }

  return (
    <>
      {user ? (
        <Drawer.Navigator
          drawerContent={(props) => <DrawerContent {...props} />}
        >
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
        </Drawer.Navigator>
      ) : (
        <Drawer.Navigator
          drawerContent={(props) => <DrawerContent {...props} />}
        >
          <Drawer.Screen
            name="Start"
            options={{ headerShown: false }}
            component={AuthNavigator}
          />
        </Drawer.Navigator>
      )}
    </>
  );
}
