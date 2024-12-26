import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '../../core/theme';

export default function Header({ style, ...props }) {
  const { key, ...otherProps } = props;
  return <Text style={[styles.header, style]} {...otherProps} />
}

const styles = StyleSheet.create({
  header: {
    fontSize: 21,
    fontWeight: 'bold',
    paddingVertical: 12,
  },
});
