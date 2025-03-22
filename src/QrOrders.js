import React, { useContext } from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { LanguageContext } from "./components/Language";
import { EnteredOrdersList } from "./components/qrorders/EnteredOrders";
import { AcceptedOrdersList } from "./components/qrorders/AcceptedOrders";
import { TabBarItem } from "./components/TabBarItem";

const Tab = createMaterialTopTabNavigator();

export default function TabContent(props) {
  const { dictionary } = useContext(LanguageContext);

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
        tabBarItem: (props) => <TabBarItem {...props} />
      }}
    >
      <Tab.Screen
        name="EnteredOrders"
        component={EnteredOrdersList}
        options={{ tabBarLabel: dictionary["nav.pendingOrders"], unmountOnBlur: true }}
      />
      <Tab.Screen
        name="AcceptedOrders"
        component={AcceptedOrdersList}
        options={{ tabBarLabel: dictionary["nav.acceptedOrders"], unmountOnBlur: true }}
      />
    </Tab.Navigator>
  );
}
