import React, { useState, useCallback, useMemo, useContext, useEffect } from "react";
import { StyleSheet, View, Modal, Text, ScrollView } from "react-native";
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
  const { dictionary } = useContext(LanguageContext);
  const [forDelivery, setForDelivery] = useState(0); // Default to 0

  const items = useMemo(() => generateItems(deliveron), [deliveron]);

  const hideModal = useCallback(() => onChangeState(false), [onChangeState]);

  // Reset forDelivery when the modal is visible
  useEffect(() => {
    if (isVisible) {
      setForDelivery(0);
    }
  }, [isVisible]);

  console.log('deliveron', deliveron);

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

  if (
    type !== "reject" &&
    type !== "status" &&
    type !== "accept"
  ) {
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
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {type === "accept" && (
              <>
                <Text style={styles.contentTitle}>
                  {dictionary["orders.approvingWarning"]}
                </Text>
                <TimePicker
                  onChange={(newTime) => setForDelivery(newTime)}
                  showButton={false}
                  backgroundColor={"white"}
                />
              </>
            )}
            {modalContent}
          </ScrollView>
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
  scrollContainer: {
    paddingBottom: 20,
  },
  contentTitle: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 20,
    textAlign: "center",
  },
});
