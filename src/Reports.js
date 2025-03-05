import React, { useContext } from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { LanguageContext } from "./components/Language";
import { OrdersListOnline, OrdersListQr } from "./components/orderlogs/OrdersListBase"; // Import the shared components

const Tab = createMaterialTopTabNavigator();

export default function TabContent(props) {
  const { dictionary } = useContext(LanguageContext);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarLabelStyle: {
          fontSize: 15,
        },
      }}
    >
      <Tab.Screen
        name="OnlineOrdersLogs"
        component={OrdersListOnline}
        options={{ tabBarLabel: dictionary["filter.onlineOrder"], unmountOnBlur: true }}
      />
      <Tab.Screen
        name="QrOrdersLogs"
        component={OrdersListQr}
        options={{ tabBarLabel: dictionary["filter.qrOrder"], unmountOnBlur: true }}
      />
    </Tab.Navigator>
  );
}