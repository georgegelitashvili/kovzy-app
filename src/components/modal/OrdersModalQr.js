import React, { useState, useCallback, useMemo, useContext, useEffect } from "react";
import { StyleSheet, View, Modal, Text, useWindowDimensions } from "react-native";
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
  const { width, height } = useWindowDimensions();
  const { dictionary } = useContext(LanguageContext);
  const [forDelivery, setForDelivery] = useState(0);

  // Calculate responsive dimensions
  const isSmallScreen = width < 400;
  const isMediumScreen = width >= 400 && width < 600;
  const isLargeScreen = width >= 600;
  const isLandscape = width > height;

  const modalWidth = isSmallScreen ? "90%" : isMediumScreen ? "85%" : "80%";
  const modalMaxHeight = isLandscape ? "90%" : "80%";
  const modalPadding = isSmallScreen ? 8 : isMediumScreen ? 12 : 15;
  const titleFontSize = isSmallScreen ? 16 : isMediumScreen ? 17 : 18;

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
        <View style={[
          styles.modalContent, 
          { 
            width: modalWidth, 
            maxHeight: modalMaxHeight,
            padding: modalPadding 
          }
        ]}>
          {type === "accept" && (
            <View style={styles.headerContent}>
              <Text style={[styles.contentTitle, { fontSize: titleFontSize }]}>
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
  },
  headerContent: {
    marginBottom: 10,
  },
  contentTitle: {
    marginVertical: 10,
    textAlign: "center",
    fontWeight: "500",
  },
});