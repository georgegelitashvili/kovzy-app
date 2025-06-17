import React, { useContext } from "react";
import { View, StyleSheet } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { LanguageContext } from "./components/Language";
import { OrdersListOnline, OrdersListQr } from "./components/orderlogs/OrdersListBase";
import { TabBarItem } from "./components/TabBarItem";

const Tab = createMaterialTopTabNavigator();

export default function TabContent(props) {
  const { dictionary } = useContext(LanguageContext);

  const renderTabBar = props => {
    return (
      <View style={styles.tabBar}>
        {Object.keys(props.descriptors).map(key => {
          const { options, route } = props.descriptors[key];
          const label = options.tabBarLabel || options.title || route.name;
          return (
            <TabBarItem
              key={key}
              label={label}
              onPress={() => props.navigation.navigate(route.name)}
              active={props.state.index === props.navigationState.routes.findIndex(r => r.name === route.name)}
              {...props.descriptors[key]}
            />
          );
        })}
      </View>
    );
  };


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
      }}
      tabBar={renderTabBar}
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

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});