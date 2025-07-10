import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  Animated,
  Pressable,
  Platform,
} from 'react-native';

export default function TextField({
  label,
  value,
  errorText,
  description,
  onFocus,
  onBlur,
  onChangeText,
  style,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const animation = useRef(new Animated.Value(value ? 1 : 0)).current;
  const inputRef = useRef(null);

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isFocused, value]);

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [18, -6], // ქვემოდან ზემოთ
  });

  const scale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.85], // ზომის შემცირება
  });

  return (
    <View style={[styles.container, style]}>
      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.inputContainer,
          {
            borderColor: errorText
              ? '#B00020'
              : isFocused
                ? '#6200ee'
                : '#999',
          },
        ]}
      >
        <Animated.View
          style={[
            styles.labelWrapper,
            {
              transform: [{ translateY }, { scale }],
            },
          ]}
          pointerEvents="none"
        >
          <Text
            style={[
              styles.label,
              {
                color: errorText
                  ? '#B00020'
                  : isFocused
                    ? '#6200ee'
                    : '#999',
              },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </Animated.View>

        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChangeText={onChangeText}
          underlineColorAndroid="transparent"
          {...props}
        />
      </Pressable>

      {description && !errorText && (
        <Text style={styles.description}>{description}</Text>
      )}
      {errorText && <Text style={styles.error}>{errorText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    height: 56, // სტანდარტული სიმაღლე
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    color: '#000',
    height: 56,
    paddingTop: 20, // ადგილი label-სთვის
    paddingBottom: 8,
    textAlignVertical: 'center',
  },
  labelWrapper: {
    position: 'absolute',
    left: 12,
    top: 0,
    zIndex: 10,
  },
  label: {
    fontSize: 16,
    backgroundColor: 'transparent', // ✅ არ აფარებს ტექსტს
    paddingHorizontal: 2,
  },
  description: {
    fontSize: 13,
    color: '#757575',
    paddingTop: 8,
  },
  error: {
    fontSize: 13,
    color: '#B00020',
    paddingTop: 8,
  },
});
