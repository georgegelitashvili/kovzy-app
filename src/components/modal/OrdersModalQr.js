import React, { useState, useCallback, useMemo, useContext, useEffect } from "react";
import { StyleSheet, View, Modal, Text } from "react-native";
import OrdersModalAccept from "./OrdersModalQrAccept";
import OrdersModalReject from "./OrdersModalQrReject";
import OrdersModalStatus from "./OrdersModalQrStatus";
import TimePicker from "../generate/TimePicker";
import { LanguageContext } from "../Language";

export default function OrdersModal({
  isVisible,
  onChangeState,
  orders,
  hasItemId,
  type,
  options,
  takeAway,
  PendingOrders,
}) {
  const { dictionary } = useContext(LanguageContext);
  const [forDelivery, setForDelivery] = useState(0);

  const hideModal = useCallback(() => onChangeState(false), [onChangeState]);

  useEffect(() => {
    if (isVisible) {
      setForDelivery(0);
    }
  }, [isVisible]);

  const modalContent = useMemo(() => {
    const commonProps = {
      itemId: hasItemId,
      options,
      takeAway,
      hideModal,
    };

    switch (type) {
      case "accept":
        return (
          <OrdersModalAccept
            {...commonProps}
            forDelivery={forDelivery}
          />
        );
      case "reject":
        return <OrdersModalReject {...commonProps} orders={orders} PendingOrders={PendingOrders} />;
      case "status":
        return <OrdersModalStatus {...commonProps} orders={orders} />;
      default:
        return (
          <View>
            <Text>Error: Invalid Modal Type</Text>
          </View>
        );
    }
  }, [type, hasItemId, options, takeAway, orders, forDelivery]);

  if (type !== "reject" && type !== "status" && type !== "accept") {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={hideModal}
    >
      <View style={styles.modal}>
        <View style={styles.modalContent}>
          {type === "accept" && (
            <View style={styles.headerContent}>
              <Text style={styles.contentTitle}>
                {dictionary["orders.approvingWarning"]}
              </Text>
              <TimePicker
                onChange={(newTime) => setForDelivery(newTime)}
                showButton={false}
                backgroundColor={"white"}
              />
            </View>
          )}
          {modalContent}
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
    padding: 10,
    width: "80%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    elevation: 5,
  },
  headerContent: {
    marginBottom: 10,
  },
  contentTitle: {
    fontSize: 18,
    marginVertical: 10,
    textAlign: "center",
  },
});