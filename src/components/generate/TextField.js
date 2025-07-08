import React from 'react';
import { View, StyleSheet, Text, Keyboard, TouchableWithoutFeedback, Platform } from 'react-native';
import { TextInput } from 'react-native-paper';
import { theme } from '../../core/theme';

export default function TextField({ errorText, description, ...props }) {
  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        underlineColor="transparent"
        mode="outlined"
        {...props}
      />
      {description && !errorText ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
    </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
  },
  input: {
    // backgroundColor: theme.colors.surface,
    ...Platform.select({
      ios: {
        textAlignVertical: 'top',
      },
      android: {
        textAlignVertical: 'top',
      },
    }),
  },
  description: {
    fontSize: 13,
    color: theme.colors.secondary,
    paddingTop: 8,
  },
  error: {
    fontSize: 13,
    color: theme.colors.error,
    paddingTop: 8,
  },
})
