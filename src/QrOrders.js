import React, { useContext } from "react";
import { View, StyleSheet } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { LanguageContext } from "./components/Language";
import { EnteredOrdersList } from "./components/qrorders/EnteredOrders";
import { AcceptedOrdersList } from "./components/qrorders/AcceptedOrders";
import { TabBarItem } from "./components/TabBarItem";

const Tab = createMaterialTopTabNavigator();

export default function TabContent() {
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
          name="QREnteredOrders"
          component={EnteredOrdersList}
          options={{ tabBarLabel: dictionary["nav.pendingOrders"], unmountOnBlur: true }}
        />
  
        <Tab.Screen
          name="QRAcceptedOrders"
          component={AcceptedOrdersList}
          options={{ tabBarLabel: dictionary["nav.acceptedOrders"], unmountOnBlur: true }}
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
