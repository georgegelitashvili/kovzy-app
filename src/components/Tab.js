import React, { useState, useEffect, useContext } from "react";
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Text } from "react-native";
import { String, LanguageContext } from './Language';

const Tab = createMaterialTopTabNavigator();

export default function TabContent(props) {
  const { dictionary } = useContext(LanguageContext);
  return (
    <Tab.Navigator initialRouteName="Orders"
        screenOptions={{
          labelStyle: {
            fontSize: 14,
          },
        }} {...props}
      >
      <Tab.Screen name="Orders" children={() => props.tabsObject.tab1} options={{ tabBarLabel: dictionary['nav.pendingOrders'] }}/>
      <Tab.Screen name="AcceptedOrders" children={() =>props.tabsObject.tab2} options={{ tabBarLabel: dictionary['nav.acceptedOrders'] }}/>
    </Tab.Navigator>
  );
}