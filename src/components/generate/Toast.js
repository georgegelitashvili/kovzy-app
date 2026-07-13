import React, { useRef, useEffect, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  useWindowDimensions,
  PanResponder,
} from "react-native";
import { LanguageContext } from "../Language";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  USER_VISIBLE_ERROR_TYPES,
  TECHNICAL_ERROR_PATTERNS,
} from "../../utils/ErrorConstants";

const Toast = ({ type, title, subtitle, animate, addStyles, onDismiss, persistent = false }) => {
  const { dictionary } = useContext(LanguageContext);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const dismissTimeoutRef = useRef(null);
  const isDismissingRef = useRef(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const dismissWithAnimation = useCallback(() => {
    if (isDismissingRef.current) {
      return;
    }
    isDismissingRef.current = true;

    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = null;
    }

    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onDismissRef.current?.();
    });
  }, [slideAnim]);

  const dismissRef = useRef(dismissWithAnimation);
  dismissRef.current = dismissWithAnimation;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 4 || Math.abs(gestureState.dx) > 4,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const isTap =
          Math.abs(gestureState.dy) < 8 && Math.abs(gestureState.dx) < 8;
        const isSwipeUp =
          gestureState.dy < -40 || gestureState.vy < -0.45;

        if (isTap || isSwipeUp) {
          dismissRef.current();
          return;
        }

        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 6,
        }).start();
      },
    })
  ).current;

  const horizontalPadding = screenWidth >= 768 ? 24 : 16;
  const toastMaxWidth = Math.min(screenWidth - horizontalPadding * 2, 600);

  const COLOR = {
    success: "#2fa360",
    warning: "#f57c00",
    failed: "#d32f2f",
    info: "#1976d2",
  }[type] || "#f44336";

  const statusBarHeight = insets.top || StatusBar.currentHeight || 0;
  const topPosition = statusBarHeight + 10;

  const getLocalizedMessage = (message, toastType) => {
    if (toastType === "failed" && dictionary) {
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

  const lowerType = typeof type === "string" ? type.toLowerCase() : "";
  const lowerSubtitle = typeof subtitle === "string" ? subtitle.toLowerCase() : "";
  const shouldSuppressNetworkError =
    lowerType.includes("network_error") ||
    lowerType.includes("network error") ||
    lowerType.includes("ქსელთან კავშირის პრობლემა") ||
    lowerSubtitle.includes("network_error") ||
    lowerSubtitle.includes("network error") ||
    lowerSubtitle.includes("ქსელთან კავშირის პრობლემა");

  const shouldSuppressTechnicalError =
    type === "failed" &&
    TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(subtitle || ""));

  const shouldSuppressMessage = processedMessage === null;
  const shouldHide =
    shouldSuppressNetworkError || shouldSuppressTechnicalError || shouldSuppressMessage;

  useEffect(() => {
    if (!animate || shouldHide) return;

    isDismissingRef.current = false;
    slideAnim.setValue(-120);

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();

    if (persistent) {
      return undefined;
    }

    const duration = type === "failed" ? 5000 : 3000;
    dismissTimeoutRef.current = setTimeout(() => {
      dismissWithAnimation();
    }, duration);

    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
        dismissTimeoutRef.current = null;
      }
    };
  }, [animate, persistent, shouldHide, slideAnim, type, dismissWithAnimation]);

  if (shouldHide) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.animatedContainer,
        {
          transform: [{ translateY: slideAnim }],
          top: topPosition,
          paddingHorizontal: horizontalPadding,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.toastBox, addStyles, { maxWidth: toastMaxWidth }]}>
        <View style={[styles.uiLine, { backgroundColor: COLOR }]} />
        <View style={styles.textContainer}>
          <Text style={styles.toastTitle}>{title}</Text>
          <Text style={styles.toastMsg}>{processedMessage}</Text>
        </View>
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
    alignItems: "center",
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
  },
  uiLine: {
    width: 4,
    height: "80%",
    borderRadius: 3,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    flexShrink: 1,
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
});

export default Toast;
