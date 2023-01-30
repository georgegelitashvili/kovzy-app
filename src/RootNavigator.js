import React, { useState, useEffect, TouchableOpacity } from "react";
import { createDrawerNavigator } from '@react-navigation/drawer';

import StackNavigator from './components/Stack';
import DrawerContent from './components/DrawerContent';

const Drawer = createDrawerNavigator();

export default function RootNavigator() {
  return (
    <Drawer.Navigator drawerContent={(props) =><DrawerContent {...props} />}>
      <Drawer.Screen name="Orders" component={StackNavigator} />
      <Drawer.Screen name="Products" component={StackNavigator} />
    </Drawer.Navigator>
  );
};