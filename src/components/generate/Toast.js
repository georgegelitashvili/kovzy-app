import React, { useRef, useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions, Animated } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const WIDTH = Dimensions.get("screen").width;

const Toast = ({ type, title, subtitle, animate, addStyles }) => {
  const [value, setValue] = useState(0);
  const ICON = type === "success" ? "checkmark-circle" : "alert-circle";

  const COLOR = {
    "success" : "#21A67A",
    "warning" : "#FFAB00",
    "failed": "#f14c4c"
  }

  useEffect(() => {
    if(animate) {
      animateToast();
      setValue(1200);
    }else {
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

  return (
    <Animated.View
      style={{ transform: [{ translateY: slideAnim }], marginBottom: 25 }}
    >
      <View style={[styles.toastBox, addStyles]}>
        <View style={[styles.uiLine, { backgroundColor: COLOR }]} />
        <Icon
          name={ICON}
          size={24}
          color={COLOR[type]}
          style={{ marginHorizontal: 5 }}
        />

        <View>
          <Text style={styles.toatTitle}>{title}</Text>
          <Text style={styles.toatMsg}>{subtitle}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

export default Toast;

const styles = StyleSheet.create({
  toastBox: {
    position: "absolute",
    top: -125,
    width: WIDTH - 25,
    zIndex: 1024,
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FCFA",
    padding: 10,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.41,
    shadowRadius: 9.11,

    elevation: 14,
    marginHorizontal: 10,
  },

  uiLine: {
    width: 4,
    height: "100%",
    borderRadius: 3,
  },

  toatTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },

  toatMsg: {
    fontSize: 13,
    fontWeight: "400",
    color: "#010101",
    marginTop: 3,
  },
});
