import React, { useState, useEffect, useContext } from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { OrdersList } from "./components/orderlogs/Orders";
import { LanguageContext } from "./components/Language";

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
        name="OrdersList"
        component={OrdersList}
        options={{ tabBarLabel: "", unmountOnBlur: true }}
      />

    </Tab.Navigator>
  );
};
