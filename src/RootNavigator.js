import React, { useContext, useState, useEffect } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import * as SecureStore from "expo-secure-store";
import { AuthContext, AuthProvider } from "./context/AuthProvider";
import { HomeNavigator, AuthNavigator } from "./components/Stack";
import DrawerContent from "./components/DrawerContent";
import { String, LanguageContext } from "./components/Language";
import Loader from "./components/generate/loader";


const Drawer = createDrawerNavigator();

export default function RootNavigator() {
  const [isLoading, setIsLoading] = useState(true);

  const { user, setUser } = useContext(AuthContext);
  const { dictionary } = useContext(LanguageContext);

  useEffect(() => {
    SecureStore.getItemAsync("user").then((user) => {
      console.log(user);
      if (user) {
        setUser(user);
      }
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return <Loader text="loading" />;
  }

  console.log('-------------------- user');
  console.log(user);
  console.log('-------------------- end user');

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
