import React from 'react';
import { View } from 'react-native';
import { TabBarItem as RNTabBarItem } from '@react-navigation/material-top-tabs';

export const TabBarItem = ({ key, ...props }) => {
  const { key: _, ...restProps } = props;
  return (
    <View key={key}>
      <RNTabBarItem key={key} {...restProps} />
    </View>
  );
}; 