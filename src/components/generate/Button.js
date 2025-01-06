import React from 'react';
import { StyleSheet } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import { theme } from '../../core/theme';

export default function Button({ mode, style, ...props }) {
  const { key, ...otherProps } = props;
  return (
    <PaperButton
      style={[
        styles.button,
        style
      ]}
      labelStyle={styles.text}
      mode={mode}
      {...otherProps}
    />
  )
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    marginVertical: 10,
    paddingVertical: 2,
  },
  text: {
    fontWeight: 'bold',
    fontSize: 15,
    lineHeight: 26,
  },
})
