import React, { useState, useCallback, useMemo, useContext, useEffect } from "react";
import { StyleSheet, View, Modal, Text, useWindowDimensions } from "react-native";
import OrdersModalAccept from "./OrdersModalAccept";
import OrdersModalReject from "./OrdersModalReject";
import OrdersModalStatus from "./OrdersModalStatus";
import TimePicker from "../generate/TimePicker";
import { LanguageContext } from "../Language";

const generateItems = (deliveron) => {
  if (Array.isArray(deliveron) && deliveron.length > 0) {
    return deliveron.map((item) => ({
      label: `${item.name || item.companyName} - ${item.price ?? item.price_before_accept}`,
      value: item.id ?? item.companyId ?? item.type,
    }));
  }

  if (deliveron?.data?.original?.content) {
    const content = deliveron.data.original.content;
    if (Array.isArray(content)) {
      return content.map((item) => ({
        label: `${item.name || item.companyName} - ${item.price ?? item.price_before_accept}`,
        value: item.id ?? item.companyId ?? item.type,
      }));
    }
    return [{
      label: `${content.name || content.companyName} - ${content.price ?? content.price_before_accept}`,
      value: content.id ?? content.companyId ?? content.type,
    }];
  }

  if (deliveron?.original?.content) {
    const content = deliveron.original.content;
    if (Array.isArray(content)) {
      return content.map((item) => ({
        label: `${item.name || item.companyName} - ${item.price ?? item.price_before_accept}`,
        value: item.id ?? item.companyId ?? item.type,
      }));
    }
    return [{
      label: `${content.name || content.companyName} - ${content.price ?? content.price_before_accept}`,
      value: content.id ?? content.companyId ?? content.type,
    }];
  }

  return [];
};

export default function OrdersModal({
  isVisible,
  onChangeState,
  orders,
  hasItemId,
  deliveron,
  deliveronOptions,
  type,
  options,
  takeAway,
  PendingOrders,
}) {
  // ALWAYS call ALL hooks at the top level - NEVER conditionally
  const { width, height } = useWindowDimensions();
  const { dictionary } = useContext(LanguageContext);
  const [forDelivery, setForDelivery] = useState(0); // Default to 0

  // Calculate responsive dimensions
  const isSmallScreen = width < 400;
  const isMediumScreen = width >= 400 && width < 600;
  const isLargeScreen = width >= 600;
  const isLandscape = width > height;

  const modalWidth = isSmallScreen ? "90%" : isMediumScreen ? "85%" : "80%";
  const modalMaxHeight = isLandscape ? "90%" : "80%";
  const modalPadding = isSmallScreen ? 8 : isMediumScreen ? 12 : 15;
  const titleFontSize = isSmallScreen ? 16 : isMediumScreen ? 17 : 18;

  const items = useMemo(() => generateItems(deliveron), [deliveron]);

  const hideModal = useCallback(() => onChangeState(false), [onChangeState]);

  // Reset forDelivery when the modal is visible
  useEffect(() => {
    if (isVisible) {
      setForDelivery(0);
    }
  }, [isVisible]);

  const modalContent = useMemo(() => {
    const commonProps = {
      itemId: hasItemId,
      deliveron: deliveron.original ?? deliveron,
      options,
      takeAway,
      hideModal,
    };

    switch (type) {
      case "accept":
        return (
          <OrdersModalAccept
            {...commonProps}
            items={items}
            deliveronOptions={deliveronOptions}
            forDelivery={forDelivery}
          />
        );
      case "reject":
        return <OrdersModalReject {...commonProps} orders={orders} PendingOrders={PendingOrders} />;
      case "status":
        return <OrdersModalStatus {...commonProps} orders={orders} deliveronOptions={deliveronOptions} />;
      default:
        return (
          <View>
            <Text>Error: Invalid Modal Type</Text>
          </View>
        ); // Fallback for unknown type
    }
  }, [type, hasItemId, deliveron, options, takeAway, items, deliveronOptions, orders, forDelivery]);

  // Check if we should hide the modal (after all hooks are called)
  const shouldHide = type !== "reject" && type !== "status" && type !== "accept";

  // Return null only after all hooks have been called
  if (shouldHide) {
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
