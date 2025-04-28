import React, { useRef, useEffect, useState, useContext } from "react";
import { View, Text, StyleSheet, Animated, useWindowDimensions } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { LanguageContext } from '../Language';

const Toast = ({ type, title, subtitle, animate, addStyles }) => {
  const [value, setValue] = useState(0);
  const { dictionary } = useContext(LanguageContext);
  
  const ICON = {
    success: "checkmark-circle",
    warning: "alert-circle",
    failed: "close-circle",
    info: "information-circle"
  }[type] || "alert-circle";

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
      setValue(1200);
    } else {
      setValue(0);
    }
  }, [animate]);

  const slideAnim = useRef(new Animated.Value(value)).current;

  const animateToast = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: 120,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }, value);
  };

  const getLocalizedMessage = (message, type) => {
    if (type === 'failed' && dictionary) {
      return dictionary[`errors.${message}`] || message;
    }
    return message;
  };

  return (
    <Animated.View
      style={[
        { transform: [{ translateY: slideAnim }] },
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
          <Text style={styles.toastMsg}>
            {getLocalizedMessage(subtitle, type)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  animatedContainer: {
    marginBottom: 25,
    position: "absolute",
    width: "100%",
    top: -130,
    zIndex: 1024,
  },
  toastBox: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FCFA",
    padding: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
    marginHorizontal: 10,
    alignSelf: 'center',
    width: '90%',
  },
  uiLine: {
    width: 4,
    height: "100%",
    borderRadius: 3,
  },
  icon: {
    marginHorizontal: 8,
  },
  textContainer: {
    flex: 1,
    marginLeft: 4,
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  toastMsg: {
    fontSize: 13,
    fontWeight: "400",
    color: "#444",
  },
});

export default Toast;