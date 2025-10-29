import React, { useRef, useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useWindowDimensions,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { LanguageContext } from "../Language";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  USER_VISIBLE_ERROR_TYPES,
  TECHNICAL_ERROR_PATTERNS,
} from "../../utils/ErrorConstants";

const Toast = ({ type, title, subtitle, animate, addStyles, onDismiss, persistent = false }) => {
  // ALWAYS call ALL hooks at the top level - NEVER conditionally
  const { dictionary } = useContext(LanguageContext);
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-120)).current;

  const ICON = {
    success: "checkmark-circle",
    warning: "alert-circle",
    failed: "close-circle",
    info: "information-circle",
  }[type] || "alert-circle";

  const COLOR = {
    success: "#2fa360",
    warning: "#f57c00",
    failed: "#d32f2f",
    info: "#1976d2",
  }[type] || "#f44336";

  const statusBarHeight = insets.top || StatusBar.currentHeight || 0;
  const topPosition = statusBarHeight + 10;

  const getLocalizedMessage = (message, type) => {
    if (type === "failed" && dictionary) {
      if (message && typeof message === "string") {
        if (USER_VISIBLE_ERROR_TYPES.includes(message)) {
          return dictionary[`errors.${message}`] || dictionary["errors.USER_FRIENDLY"] || message;
        }
        if (message.startsWith("errors.")) {
          return dictionary[message] || dictionary["errors.USER_FRIENDLY"] || message;
        }
        return message;
      }
    }
    return message;
  };

  const processedMessage = getLocalizedMessage(subtitle, type);

  // Check conditions that would suppress the toast
  const lowerType = typeof type === 'string' ? type.toLowerCase() : '';
  const lowerSubtitle = typeof subtitle === 'string' ? subtitle.toLowerCase() : '';
  const shouldSuppressNetworkError = (
    lowerType.includes('network_error') ||
    lowerType.includes('network error') ||
    lowerType.includes('ქსელთან კავშირის პრობლემა') ||
    lowerSubtitle.includes('network_error') ||
    lowerSubtitle.includes('network error') ||
    lowerSubtitle.includes('ქსელთან კავშირის პრობლემა')
  );

  const shouldSuppressTechnicalError = type === "failed" && TECHNICAL_ERROR_PATTERNS.some((pattern) =>
    pattern.test(subtitle || "")
  );

  const shouldSuppressMessage = processedMessage === null;

  const shouldHide = shouldSuppressNetworkError || shouldSuppressTechnicalError || shouldSuppressMessage;

  // Animation effect - ALWAYS call useEffect hooks
  useEffect(() => {
    if (!animate || shouldHide) return;

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();

    if (persistent) {
      return;
    }

    const duration = type === "failed" ? 5000 : 3000;
    const timeout = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 300,
        useNativeDriver: true,
      }).start();

      if (onDismiss) {
        setTimeout(onDismiss, 400);
      }
    }, duration);

    return () => clearTimeout(timeout);
  }, [animate, persistent, shouldHide, slideAnim, type, onDismiss]);
  
  // Handle dismiss action
  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  // Return null if we should hide the toast (after all hooks are called)
  if (shouldHide) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.animatedContainer,
        { transform: [{ translateY: slideAnim }], top: topPosition },
      ]}
    >
      <View style={[styles.toastBox, addStyles]}>
        <View style={[styles.uiLine, { backgroundColor: COLOR }]} />
        <Icon name={ICON} size={24} color={COLOR} style={styles.icon} />
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
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
    alignItems: "center",
    pointerEvents: "box-none",
  },
  toastBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FCFA",
    padding: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
    width: "100%",
    maxWidth: 600, // restrict max width
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
    backgroundColor: "#f0f0f0",
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    fontSize: 16,
    color: "#666",
    fontWeight: "bold",
  },
});

export default Toast;
