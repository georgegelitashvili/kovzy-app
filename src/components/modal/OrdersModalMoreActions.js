import React, { useContext } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LanguageContext } from "../Language";

export default function OrdersModalMoreActions({
  visible,
  onClose,
  onEdit,
  onSchedule,
  onDelay,
  showEdit = false,
  showSchedule = false,
  showDelay = false,
  loading = false,
}) {
  const { dictionary } = useContext(LanguageContext);

  if (!visible) {
    return null;
  }

  const actions = [
    showEdit && {
      key: "edit",
      icon: "pencil-outline",
      label: dictionary["orders.editOrder"] || "Edit Order",
      color: "#3490dc",
      onPress: onEdit,
    },
    showSchedule && {
      key: "schedule",
      icon: "clock-outline",
      label: dictionary["orders.scheduleOrder"] || "Schedule Order",
      color: "#6f42c1",
      onPress: onSchedule,
    },
    showDelay && {
      key: "delay",
      icon: "bell-ring-outline",
      label: dictionary["orders.postponeOrder"] || "Postpone Order",
      color: "#f0ad4e",
      onPress: onDelay,
    },
  ].filter(Boolean);

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {dictionary["orders.moreActions"] || "More Actions"}
        </Text>
        <TouchableOpacity onPress={onClose} disabled={loading} hitSlop={8}>
          <MaterialCommunityIcons name="close" size={22} color="#6c757d" />
        </TouchableOpacity>
      </View>

      <View style={styles.actionsList}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.key}
            style={styles.actionButton}
            disabled={loading}
            onPress={() => {
              if (loading) return;
              onClose();
              action.onPress?.();
            }}
          >
            <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
              <MaterialCommunityIcons
                name={action.icon}
                size={20}
                color="white"
              />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    paddingTop: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#212529",
  },
  actionsList: {
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: "#f8f9fa",
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  actionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#212529",
  },
});
