import React, { useContext, useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { AuthContext } from "./context/AuthProvider";
import { OrdersNavigator, QrOrdersNavigator, ReportsNavigator, ProductsNavigator, AuthNavigator, SettingsNavigator } from "./components/Stack";
import DrawerContent from "./components/DrawerContent";
import { LanguageContext } from "./components/Language";
import ErrorDisplay from "./components/generate/ErrorDisplay";
import Loader from "./components/generate/loader";

const Drawer = createDrawerNavigator();

const RootNavigator = () => {
  const { user, isLoading, branchEnabled, error } = useContext(AuthContext);
  const { dictionary } = useContext(LanguageContext);

  if (isLoading) {
    return <Loader text={dictionary?.["loading"]} />;
  }

  // If there is a persistent LOGIN_ERROR, show AuthNavigator but keep error visible
  if (!user?.token) {
    if (error && error.type === "LOGIN_ERROR" && error.persistent) {
      // Force AuthNavigator to show Login screen
      return (
        <>
          <ErrorDisplay error={error} />
          <AuthNavigator initialRouteName="Login" />
        </>
      );
    }
    console.log("[RootNavigator] User not authenticated, showing AuthNavigator");
    return <AuthNavigator />;
  }

  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        drawerStyle: {
          backgroundColor: '#fff',
        },
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
        }
      }}
      initialRouteName="Orders"
    >
      <Drawer.Screen
        name="Orders"
        component={OrdersNavigator}
        options={{
          title: dictionary["nav.onlineOrders"],
          unmountOnBlur: true
        }}
      />
      <Drawer.Screen
        name="QrOrders"
        component={QrOrdersNavigator}
        options={{
          title: dictionary["nav.QROrders"],
          unmountOnBlur: true
        }}
      />
      <Drawer.Screen
        name="Reports"
        component={ReportsNavigator}
        options={{
          title: dictionary["nav.Reports"],
          unmountOnBlur: true
        }}
      />
      <Drawer.Screen
        name="Products"
        component={ProductsNavigator}
        options={{
          title: dictionary["nav.products"],
          unmountOnBlur: true
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{
          title: dictionary["settings"],
          unmountOnBlur: true
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  }
});

export default RootNavigator;
