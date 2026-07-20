import React from "react";
import { View, StyleSheet } from "react-native";
import { TabBarItem } from "./TabBarItem";

/**
 * Material top-tabs custom tab bar using React Navigation's `state.index`
 * (reliable across v6/v7) instead of per-route isFocused().
 */
export function CustomTabBar({ state, descriptors, navigation }) {
  const navState = state ?? navigation?.getState?.();
  const routes = Array.isArray(navState?.routes) ? navState.routes : [];
  const activeIndex = Number.isInteger(navState?.index) ? navState.index : -1;

  return (
    <View style={styles.tabBar}>
      {routes.map((route, index) => {
        const descriptor = descriptors?.[route.key];
        const options = descriptor?.options ?? {};
        const label = options.tabBarLabel || options.title || route.name;

        return (
          <TabBarItem
            key={route.key}
            label={label}
            onPress={() => navigation.navigate(route.name)}
            active={index === activeIndex}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "space-between",
  },
});
