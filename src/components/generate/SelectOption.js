import React from 'react'
import { View, Platform, StyleSheet, Text, Keyboard, TouchableWithoutFeedback } from 'react-native';
import RNPickerSelect from "react-native-picker-select";
import { theme } from '../../core/theme';

export default function SelectOption({ errorText, description, ...props }) {
  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={styles.container}>
        <RNPickerSelect
          useNativeAndroidPickerStyle={false}
          style={{...pickerSelectStyles}}
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
    height: 50,
    marginVertical: 12,
  },
  pickerSelect: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 4,
    color: 'black',
    paddingRight: 30,
    ...Platform.select({
      ios: {
        backgroundColor: theme.colors.surface,
        border: '',
        borderWidth: 1,
        borderColor: 'gray',
      },
      android: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: '#000',
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
});


const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 4,
    borderColor: 'gray',
    paddingRight: 30,
    backgroundColor: theme.colors.surface,
  },
  inputAndroid: {
      fontSize: 16,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: 'gray',
      color: 'black',
      paddingRight: 30,
      backgroundColor: theme.colors.surface,
  },
  })