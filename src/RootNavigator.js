import React, { useContext, useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { AuthContext } from "./context/AuthProvider";
import { OrdersNavigator, QrOrdersNavigator, ReportsNavigator, ProductsNavigator, AuthNavigator, SettingsNavigator } from "./components/Stack";
import DrawerContent from "./components/DrawerContent";
import { LanguageContext } from "./components/Language";
import ErrorDisplay from "./components/generate/ErrorDisplay";
import Loader from "./components/generate/loader";
import eventEmitter from "./utils/EventEmitter";

const Drawer = createDrawerNavigator();

const RootNavigator = () => {
  const { user, domain, branchid, isLoading, branchEnabled, error, justLoggedOut, clearJustLoggedOut } = useContext(AuthContext);
  const { dictionary } = useContext(LanguageContext);
  const [forceRoute, setForceRoute] = useState(null);

  // Listen for navigation reset events
  useEffect(() => {
    const handleResetToDomain = () => {
      console.log('[RootNavigator] Received resetToDomain event');
      setForceRoute('Domain');
      // Clear the force route after a short delay
      setTimeout(() => {
        setForceRoute(null);
      }, 500);
    };

    const listenerId = eventEmitter.addEventListener('resetToDomain', handleResetToDomain);
    return () => {
      eventEmitter.removeEventListener(listenerId);
    };
  }, []);

  // Clear justLoggedOut flag in useEffect to avoid React warning
  useEffect(() => {
    if (justLoggedOut) {
      console.log("[RootNavigator] Clearing justLoggedOut flag");
      clearJustLoggedOut();
    }
  }, [justLoggedOut, clearJustLoggedOut]);

  if (isLoading) {
    return <Loader text={dictionary?.["loading"]} />;
  }

  // If there is a persistent LOGIN_ERROR, show AuthNavigator but keep error visible
  if (!user?.token) {
    console.log("[RootNavigator] checking for persistent LOGIN_ERROR", error);
    
    // Determine the correct initial route based on available data
    let initialRoute = "Domain";
    
    // Force route overrides everything (used for logout navigation)
    if (forceRoute) {
      console.log("[RootNavigator] Using forced route:", forceRoute);
      initialRoute = forceRoute;
    } else if (justLoggedOut) {
      console.log("[RootNavigator] Just logged out, forcing Domain screen");
      initialRoute = "Domain";
    } else if (domain && branchid) {
      // Have both domain and branch, go to login
      initialRoute = "Login";
    } else if (domain) {
      // Have domain but no branch, go to branch selection
      initialRoute = "Branch";
    }
    // If no domain, stay on "Domain"
    
    console.log("[RootNavigator] Initial route determined:", initialRoute, "Domain:", domain, "Branch:", branchid);
    
    // Skip error display if we're forcing a route (during logout)
    if (error && error.type === "LOGIN_ERROR" && !forceRoute) {
      // Force login screen for login errors, don't redirect to domain
      return (
        <>
          <ErrorDisplay error={error} />
          <AuthNavigator initialRouteName="Login" />
        </>
      );
    }
    console.log("[RootNavigator] User not authenticated, showing AuthNavigator with route:", initialRoute);
    return <AuthNavigator initialRouteName={initialRoute} />;
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
