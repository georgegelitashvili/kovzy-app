import React, { useState, useEffect, TouchableOpacity } from "react";
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Text } from "react-native";

const Tab = createMaterialTopTabNavigator();

export default function TabContent(props) {
  return (
    <Tab.Navigator initialRouteName="Orders"
        screenOptions={{
          labelStyle: {
            fontSize: 14,
          },
        }} {...props}
      >
      <Tab.Screen name="Orders" children={() => props.tabsObject.tab1} options={{ tabBarLabel: 'შემოსული' }}/>
      {/* <Tab.Screen name="AcceptedOrders" children={() =>props.tabsObject.tab2} options={{ tabBarLabel: 'მიღებული' }}/> */}
    </Tab.Navigator>
  );
}