import React, { useContext } from "react";
import { createDrawerNavigator } from '@react-navigation/drawer';

import StackNavigator from './components/Stack';
import DrawerContent from './components/DrawerContent';
import { String, LanguageContext } from './components/Language';

const Drawer = createDrawerNavigator();

export default function RootNavigator() {
  const { dictionary } = useContext(LanguageContext);
  return (
    <Drawer.Navigator drawerContent={(props) =><DrawerContent {...props} />}>
      <Drawer.Screen name="Start" options={{ headerShown: false }} component={StackNavigator} />
      <Drawer.Screen name="Orders" options={{ headerTitle: dictionary['nav.onlineOrders'] }} component={StackNavigator} />
      <Drawer.Screen name="Products" options={{ headerTitle: dictionary['nav.products'] }} component={StackNavigator} />
    </Drawer.Navigator>
  );
};