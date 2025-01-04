import React, { useState, useEffect, useContext } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { EnteredOrdersList } from "./components/qrorders/EnteredOrders";
import { PostponeOrders } from "./components/qrorders/PostponeOrders";
import { AcceptedOrdersList } from "./components/qrorders/AcceptedOrders";
import { LanguageContext } from "./components/Language";

const Tab = createMaterialTopTabNavigator();

export default function TabContent(props) {
  const { dictionary } = useContext(LanguageContext);
  const [postponeOrderShow, setPostponeOrderShow] = useState(false);

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

      {postponeOrderShow ? (<Tab.Screen
        name="PlannedOrders"
        component={PostponeOrders}
        options={{ tabBarLabel: dictionary["nav.plannedOrders"], unmountOnBlur: true }}
        />): null}

      <Tab.Screen
        name="AcceptedOrders"
        component={AcceptedOrdersList}
        options={{ tabBarLabel: dictionary["nav.acceptedOrders"], unmountOnBlur: true }}
      />
    </Tab.Navigator>
  );
};
