import React, { useContext, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Modal,
  Text,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import TimePicker from "../generate/TimePicker";
import { LanguageContext } from "../Language";

function formatDelayTime(totalMinutes) {
  const safeMinutes = Math.max(0, Number(totalMinutes) || 0);
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}:00`;
}

export default function OrdersModalTimePicker({
  visible,
  onClose,
  onConfirm,
  title,
  initialMinutes = 30,
  loading = false,
}) {
  const { width, height } = useWindowDimensions();
  const { dictionary } = useContext(LanguageContext);
  const [selectedMinutes, setSelectedMinutes] = useState(initialMinutes);

  const isSmallScreen = width < 400;
  const isMediumScreen = width >= 400 && width < 600;
  const isLandscape = width > height;

  const modalWidth = isSmallScreen ? "90%" : isMediumScreen ? "85%" : "80%";
  const modalMaxHeight = isLandscape ? "90%" : "80%";
  const modalPadding = isSmallScreen ? 8 : isMediumScreen ? 12 : 15;
  const titleFontSize = isSmallScreen ? 16 : isMediumScreen ? 17 : 18;

  useEffect(() => {
    if (visible) {
      setSelectedMinutes(Math.max(0, Number(initialMinutes) || 0));
    }
  }, [visible, initialMinutes]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        <View
          style={[
            styles.modalContent,
            {
              width: modalWidth,
              maxHeight: modalMaxHeight,
              padding: modalPadding,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.closeIconButton}
            onPress={onClose}
            hitSlop={10}
            disabled={loading}
          >
            <MaterialCommunityIcons name="close" size={24} color="#6c757d" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={[styles.contentTitle, { fontSize: titleFontSize }]}>
              {title || dictionary["orders.scheduleOrder"] || "Schedule Order"}
            </Text>
            <TimePicker
              key={`schedule-picker-${visible ? "open" : "closed"}-${initialMinutes}`}
              onChange={setSelectedMinutes}
              showButton={false}
              backgroundColor="white"
              initialMinutes={initialMinutes}
            />
          </View>

          <View style={styles.buttonModal}>
            <Button
              mode="contained"
              textColor="white"
              style={styles.buttonAccept}
              contentStyle={styles.buttonAcceptContent}
              labelStyle={styles.buttonAcceptLabel}
              onPress={() => onConfirm?.(formatDelayTime(selectedMinutes))}
              disabled={loading}
            >
              {dictionary["orders.approve"] || "დადასტურება"}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    position: "relative",
  },
  closeIconButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 2,
    padding: 4,
  },
  headerContent: {
    marginBottom: 10,
    marginTop: 12,
  },
  contentTitle: {
    marginVertical: 10,
    textAlign: "center",
    fontWeight: "500",
  },
  buttonModal: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 48,
    width: "100%",
  },
  buttonAccept: {
    backgroundColor: "#28A745",
    borderRadius: 10,
    minWidth: 220,
  },
  buttonAcceptContent: {
    minHeight: 56,
    paddingHorizontal: 48,
    justifyContent: "center",
  },
  buttonAcceptLabel: {
    fontSize: 18,
    fontWeight: "700",
  },
});
