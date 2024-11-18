import React, { useState, useEffect, useContext } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { EnteredOrdersList } from "./components/orders/EnteredOrders";
import { PostponeOrders } from "./components/orders/PostponeOrders";
import { AcceptedOrdersList } from "./components/orders/AcceptedOrders";
import { LanguageContext } from "./components/Language";

const Tab = createMaterialTopTabNavigator();

export default function TabContent(props) {
  const { dictionary } = useContext(LanguageContext);
  const [postponeOrderShow, setPostponeOrderShow] = useState(false);

  // Load the stored value on component mount
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
