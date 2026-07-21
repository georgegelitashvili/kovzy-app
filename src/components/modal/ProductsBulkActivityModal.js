import React, { useContext } from "react";
import {
  Modal,
  StyleSheet,
  View,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { Text, Button } from "react-native-paper";
import { LanguageContext } from "../Language";

const OPTIONS = [
  {
    key: "all",
    value: "",
    labelKey: "prod.disableProduct",
    fallback: "Disable",
  },
  {
    key: "qr",
    value: "qr-menu",
    labelKey: "prod.disableProductQr",
    fallback: "Disable for QR-MENU",
  },
  {
    key: "online",
    value: "online",
    labelKey: "prod.disableProductOnline",
    fallback: "Disable for Online Orders",
  },
];

export default function ProductsBulkActivityModal({
  visible,
  selectedCount = 0,
  onClose,
  onApply,
  loading = false,
}) {
  const { width } = useWindowDimensions();
  const { dictionary } = useContext(LanguageContext);
  const isSmallScreen = width < 400;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.content, { width: isSmallScreen ? "92%" : "80%" }]}>
          <Text style={styles.title}>
            {dictionary["prod.productAvailability"] || "Availability"}
          </Text>
          <Text style={styles.subtitle}>
            {(dictionary["prod.selectedCount"] || "{count} products selected").replace(
              "{count}",
              String(selectedCount)
            )}
          </Text>

          <View style={styles.buttons}>
            {OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[styles.actionButton, loading && styles.disabled]}
                disabled={loading}
                onPress={() => onApply([option.value], "toggle")}
              >
                <Text style={styles.actionButtonText}>
                  {dictionary[option.labelKey] || option.fallback}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            mode="outlined"
            style={styles.cancelButton}
            disabled={loading}
            onPress={onClose}
          >
            {dictionary["cancel"] || "Cancel"}
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  content: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    maxWidth: 420,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    color: "#222",
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 16,
  },
  buttons: {
    gap: 10,
  },
  actionButton: {
    backgroundColor: "#f14c4c",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  cancelButton: {
    marginTop: 16,
  },
});
