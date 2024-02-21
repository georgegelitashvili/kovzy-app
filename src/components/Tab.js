import React, { useState, useEffect, useContext } from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Text } from "react-native";
import { String, LanguageContext } from "./Language";

const Tab = createMaterialTopTabNavigator();

export default function TabContent(props) {
  const { dictionary } = useContext(LanguageContext);


  return (
    <Tab.Navigator
      initialRouteName="Orders"
      screenOptions={{
        labelStyle: {
          fontSize: 14,
        },
      }}
    >
      <Tab.Screen
        name="Orders"
        children={() => props.tab1}
        options={{ tabBarLabel: dictionary["nav.pendingOrders"], unmountOnBlur: true }}
      />
      <Tab.Screen
        name="AcceptedOrders"
        children={() => props.tab2}
        options={{ tabBarLabel: dictionary["nav.acceptedOrders"], unmountOnBlur: true }}
      />
    </Tab.Navigator>
  );
}
