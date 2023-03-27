import React, { useState, useCallback } from 'react'
import { View, Platform, StyleSheet, Text, Keyboard, TouchableWithoutFeedback } from 'react-native';
import RNPickerSelect from "react-native-picker-select";
import { theme } from '../../core/theme';

export default function SelectOption({ errorText, description, ...props }) {
  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={styles.container}>
        <RNPickerSelect
          style={styles.pickerSelect}
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
  pickerSelect: {
    backgroundColor: theme.colors.surface,
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30,
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
});

const pickerSelectStyles = StyleSheet.create({
  pickerSelect: {
      backgroundColor: theme.colors.surface,
      fontSize: 16,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: 'gray',
      borderRadius: 4,
      color: 'black',
      paddingRight: 30,
    },
  });