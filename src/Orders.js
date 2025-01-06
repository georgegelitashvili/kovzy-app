import React, { useState, useEffect, useContext } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import * as Battery from 'expo-battery';
import * as IntentLauncher from 'expo-intent-launcher';
import { EnteredOrdersList } from "./components/orders/EnteredOrders";
import { PostponeOrders } from "./components/orders/PostponeOrders";
import { AcceptedOrdersList } from "./components/orders/AcceptedOrders";
import { LanguageContext } from "./components/Language";

const Tab = createMaterialTopTabNavigator();

export default function TabContent() {
  const lowPowerMode = Battery.useLowPowerMode();
  const [postponeOrderShow, setPostponeOrderShow] = useState(false);
  const { dictionary } = useContext(LanguageContext);

  useEffect(() => {
    if (lowPowerMode) {
      const showAlert = () => {
        Alert.alert(
          'Low Power Mode is On',
          'To receive notifications, please turn off Low Power Mode.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Go to Settings',
              onPress: () => {
                IntentLauncher.startActivityAsync(
                  IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
                );
              },
            },
          ]
        );
      };

      showAlert();

      const intervalId = setInterval(() => {
        if (lowPowerMode) {
          showAlert();
        }
      }, 30000);

      return () => clearInterval(intervalId);
    }
  }, [lowPowerMode]);

  useEffect(() => {
    const loadStoredValue = async () => {
      try {
        const storedValue = await AsyncStorage.getItem('postponeOrderShow');
        if (storedValue !== null) {
          // Set the state to the stored value (parsing it to boolean)
          setPostponeOrderShow(JSON.parse(storedValue));
        }
      } catch (error) {
        console.error('Failed to load stored value', error);
      }
    };

    loadStoredValue();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarLabelStyle: {
          fontSize: 15,
        },
      }}
    >
      <Tab.Screen
        name="EnterdOrders"
        component={EnteredOrdersList}
        options={{ tabBarLabel: dictionary["nav.pendingOrders"], unmountOnBlur: true }}
      />

      {postponeOrderShow ? (
        <Tab.Screen
          name="PlannedOrders"
          component={PostponeOrders}
          options={{ tabBarLabel: dictionary["nav.plannedOrders"], unmountOnBlur: true }}
        />
      ) : null}

      <Tab.Screen
        name="AcceptedOrders"
        component={AcceptedOrdersList}
        options={{ tabBarLabel: dictionary["nav.acceptedOrders"], unmountOnBlur: true }}
      />
    </Tab.Navigator>
  );
};
