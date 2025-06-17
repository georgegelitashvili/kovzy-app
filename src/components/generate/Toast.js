import React, { useRef, useEffect, useState, useContext } from "react";
import { View, Text, StyleSheet, Animated, useWindowDimensions, TouchableOpacity, StatusBar, Platform } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { LanguageContext } from '../Language';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ONLY show these error types in toast
const USER_VISIBLE_ERROR_TYPES = [
  'NETWORK_ERROR',     // Only show network connectivity issues
  'NOT_FOUND'          // Only show when requested data is not found
];

// Regex patterns to detect technical errors that should never be shown to users
const TECHNICAL_ERROR_PATTERNS = [
  /failed to load/i,
  /music/i,
  /audio/i,
  /sound/i,
  /cannot read/i,
  /undefined/i,
  /null/i,
  /function/i,
  /error code/i,
  /exception/i,
  /stack/i,
  /syntax/i,
  /reference/i,
  /type error/i,
  /has been rejected/i,    // Catch rejected promises
  /update/i                // Catch update-related errors
];

const Toast = ({ type, title, subtitle, animate, addStyles, onDismiss }) => {
  const [value, setValue] = useState(0);
  const { dictionary } = useContext(LanguageContext);
  const insets = useSafeAreaInsets();
  
  // Skip rendering technical error toasts completely
  if (type === 'failed') {
    // Check if it's a technical error message
    const containsTechnicalDetails = TECHNICAL_ERROR_PATTERNS.some(pattern => 
      pattern.test(subtitle || '')
    );
    
    if (containsTechnicalDetails) {
      console.log('Suppressing toast with technical error details:', subtitle);
      return null; // Don't render anything
    }
  }
  
  // Map error types to appropriate icons
  const ICON = {
    success: "checkmark-circle",
    warning: "alert-circle",
    failed: "close-circle",
    info: "information-circle"
  }[type] || "alert-circle";

  // Map error types to appropriate colors
  const COLOR = {
    success: "#2fa360",
    warning: "#f57c00",
    failed: "#d32f2f",
    info: "#1976d2"
  }[type] || "#f44336";

  const { width: screenWidth } = useWindowDimensions();

  useEffect(() => {
    if (animate) {
      animateToast();
      // Auto-dismiss after a delay
      if (type !== "failed") {
        setValue(3000); // Shorter display time (3 seconds) for normal toasts
      } else {
        setValue(5000); // Longer (5 seconds) for error messages
      }
    } else {
      setValue(0);
    }
  }, [animate]);

  const slideAnim = useRef(new Animated.Value(-120)).current;

  const animateToast = () => {
    // Animate toast in
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Automatically animate toast out after delay
    setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Call onDismiss when toast is hidden, if provided
      if (onDismiss) {
        setTimeout(onDismiss, 400);
      }
    }, value);
  };

  const getLocalizedMessage = (message, type) => {
    // For error messages, try to find a localized version or hide if it's technical
    if (type === 'failed' && dictionary) {
      // Check if it's a technical error that should not be shown
      const isErrorKey = message && message.startsWith('errors.');
      
      if (isErrorKey) {
        const errorType = message.replace('errors.', '');
        if (!USER_VISIBLE_ERROR_TYPES.includes(errorType)) {
          console.log('Suppressing toast message for error type:', errorType);
          return null; // Will prevent rendering below
        }
      }
      
      const errorKey = `errors.${message}`;
      return dictionary[errorKey] || dictionary['errors.USER_FRIENDLY'] || message;
    }
    return message;
  };

  // Process the message
  const processedMessage = getLocalizedMessage(subtitle, type);
  
  // Don't render anything if message was suppressed
  if (processedMessage === null) {
    return null;
  }

  // Handle manual dismiss
  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    if (onDismiss) {
      setTimeout(onDismiss, 400);
    }
  };

  // Calculate top position based on safe area insets
  const statusBarHeight = insets.top || StatusBar.currentHeight || 0;
  const topPosition = statusBarHeight + 10; // 10px additional padding
  
  return (
    <Animated.View
      style={[
        { 
          transform: [{ translateY: slideAnim }],
          top: topPosition
        },
        styles.animatedContainer
      ]}
    >
      <View style={[styles.toastBox, addStyles]}>
        <View style={[styles.uiLine, { backgroundColor: COLOR }]} />
        <Icon
          name={ICON}
          size={24}
          color={COLOR}
          style={styles.icon}
        />
        <View style={styles.textContainer}>
          <Text style={styles.toastTitle}>{title}</Text>
          <Text style={styles.toastMsg}>{processedMessage}</Text>
        </View>
        <TouchableOpacity 
          onPress={handleDismiss} 
          style={styles.closeButton}
          accessibilityLabel="Dismiss notification"
          accessibilityRole="button"
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  animatedContainer: {
    position: "absolute",
    width: "100%",
    zIndex: 1024,
    paddingHorizontal: 10,
  },
  toastBox: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FCFA",
    padding: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
    width: '100%',
  },
  uiLine: {
    width: 4,
    height: "80%",
    borderRadius: 3,
    marginRight: 8,
  },
  icon: {
    marginHorizontal: 8,
  },
  textContainer: {
    flex: 1,
    marginLeft: 4,
  },
  toastTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  toastMsg: {
    fontSize: 14,
    fontWeight: "400",
    color: "#444",
  },
  closeButton: {
    padding: 8,
    borderRadius: 50,
    marginLeft: 4,
    backgroundColor: '#f0f0f0',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
});

export default Toast;