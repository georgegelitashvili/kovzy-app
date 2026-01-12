import React, { useState, useEffect, useContext } from "react";
import {
  Alert,
  View,
  StyleSheet
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import * as Battery from 'expo-battery';
import * as IntentLauncher from 'expo-intent-launcher';
import { EnteredOrdersList } from "./components/orders/EnteredOrders";
import { PostponeOrders } from "./components/orders/PostponeOrders";
import { AcceptedOrdersList } from "./components/orders/AcceptedOrders";
import { LanguageContext } from "./components/Language";
import { TabBarItem } from "./components/TabBarItem";
import eventEmitter from "./utils/EventEmitter";

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
          setPostponeOrderShow(JSON.parse(storedValue));
        }
      } catch (error) {
        console.error('Failed to load stored value', error);
      }
    };

    loadStoredValue();

    // Listen for storage changes
    const handleSettingChange = (event) => {
      if (event && typeof event.postponeOrderShow === 'boolean') {
        setPostponeOrderShow(event.postponeOrderShow);
      }
    };

    const listener = eventEmitter.addEventListener('postponeOrderSettingChanged', handleSettingChange);

    return () => {
      eventEmitter.removeEventListener(listener);
    };
  }, []);

  const renderTabBar = props => {
    return (
      <View style={styles.tabBar}>
        {Object.keys(props.descriptors).map(key => {
          const { options, route } = props.descriptors[key];
          const label = options.tabBarLabel || options.title || route.name;
          return (
            <TabBarItem
              key={key}
              label={label}
              onPress={() => props.navigation.navigate(route.name)}
              active={props.state.index === props.navigationState.routes.findIndex(r => r.name === route.name)}
              {...props.descriptors[key]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarLabelStyle: {
          fontSize: 15,
        },
        tabBarItemStyle: {
          minWidth: 0,
          paddingHorizontal: 10,
        },
        tabBarStyle: {
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
      tabBar={renderTabBar}
    >
      <Tab.Screen
        name="EnteredOrders"
        component={EnteredOrdersList}
        options={{ tabBarLabel: dictionary["nav.pendingOrders"], unmountOnBlur: true }}
      />

      {postponeOrderShow && (
        <Tab.Screen
          name="PlannedOrders"
          component={PostponeOrders}
          options={{ tabBarLabel: dictionary["nav.plannedOrders"], unmountOnBlur: true }}
        />
      )}

      <Tab.Screen
        name="AcceptedOrders"
        component={AcceptedOrdersList}
        options={{ tabBarLabel: dictionary["nav.acceptedOrders"], unmountOnBlur: true }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
