import React from 'react';
import { View, StyleSheet, Text, Keyboard, TouchableWithoutFeedback } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { theme } from '../../core/theme';

export default function SelectOption({ errorText, description, placeholder = "", items, ...props }) {
  // Destructure key from props to ensure it is not spread into JSX
  const { key, ...otherProps } = props;

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={styles.container}>
        {items && items.length > 0 && (
          <RNPickerSelect
            useNativeAndroidPickerStyle={false}
            placeholder={{ label: placeholder }}
            style={pickerSelectStyles}
            items={items.map((item, index) => ({ label: item.label, value: item.value, key: index.toString() }))}
            {...otherProps} // Spread otherProps without key
          />
        )}
        {description && !errorText && (
          <Text style={styles.description}>{description}</Text>
        )}
        {errorText && <Text style={styles.error}>{errorText}</Text>}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 50,
    marginVertical: 12,
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
    // backgroundColor: theme.colors.surface,
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
    // backgroundColor: theme.colors.surface,
  },
});
