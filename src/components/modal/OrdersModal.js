import React, { useEffect, useCallback, useState, useMemo, useContext } from "react";
import { StyleSheet, View, Dimensions, Platform, Alert, } from "react-native";
import Modal from "react-native-modal";
import { AuthContext, AuthProvider } from "../../context/AuthProvider";
import OrdersModalAccept from "./OrdersModalAccept";
import OrdersModalReject from "./OrdersModalReject";
import OrdersModalStatus from "./OrdersModalStatus";

const deviceWidth = Dimensions.get("window").width;
const deviceHeight = Dimensions.get("window").height;

export default function OrdersModal({
  isVisible,
  onChangeState,
  orders,
  hasItemId,
  deliveron,
  deliveronOptions,
  type,
  options,
  takeAway
}) {
  const [visible, setVisible] = useState(isVisible);
  const { intervalId, setIntervalId } = useContext(AuthContext);

  useEffect(() => {
    setVisible(isVisible);
  }, [isVisible]);

  const hideModal = useCallback(() => {
    onChangeState(false);
  }, [onChangeState]);

  const handleChangeStateClick = useCallback(() => {
    onChangeState(false);
  });

  const items = useMemo(() => {
    if (deliveron.original?.status !== -2) {
      const content = deliveron.original?.content;
      if (!content) return null;
      if (Array.isArray(content)) {
        return content.map((item) => ({
          label: !item.name ? item.companyName + ' - ' + item.price : item.name + ' - ' + item.price ?? item.price_before_accept,
          value: !item.id ? item.companyId ?? item.type : item.id,
        }));
      } else {
        return [
          {
            label: !content.name ? content.companyName + ' - ' + content.price : content.name + ' - ' + content.price_before_accept,
            value: !content.id ? content.companyId ?? content.type : content.id,
          },
        ];
      }
    } else {
      return null;
    }
  }, [deliveron.original?.content, deliveron.original?.status]);

  const loadModalComponent = () => {
    switch (type) {
      case 'accept':
        return (
          <OrdersModalAccept
            itemId={hasItemId}
            deliveron={deliveron.original}
            deliveronOptions={deliveronOptions}
            options={options}
            items={items}
            takeAway={takeAway}
            hideModal={hideModal}
          />
        )
      case 'reject':
        return (
          <OrdersModalReject
            itemId={hasItemId}
            deliveron={deliveron.original ?? deliveron}
            orders={orders}
            options={options}
            takeAway={takeAway}
            hideModal={hideModal}
          />
        )
      case 'status':
        return (
          <OrdersModalStatus
            itemId={hasItemId}
            orders={orders}
            deliveron={deliveron.original ?? deliveron}
            options={options}
            deliveronOptions={deliveronOptions}
            takeAway={takeAway}
            hideModal={hideModal}
          />
        )
    }
  }

  console.log(takeAway);

  if (deliveron.length === 0 || deliveron.original?.content.length === 0) {
    return null;
  }

  return (
    <>
      {visible === false ? handleChangeStateClick() : null}

      <View style={styles.modal}>
        <Modal
          isVisible={visible}
          deviceWidth={deviceWidth}
          deviceHeight={deviceHeight}
          backdropColor="#141414"
          backdropOpacity={0.8}
          animationIn="zoomInDown"
          animationOut="slideOutDown"
          animationInTiming={600}
          animationOutTiming={1000}
          backdropTransitionInTiming={600}
          backdropTransitionOutTiming={1000}
        >
          {loadModalComponent()}
        </Modal>
      </View>
    </>
  );
}


const styles = StyleSheet.create({
  modal: {
    flex: 1,
    height: 500,
    backgroundColor: "#fff",
    alignItems: "center",
    borderRadius: 13,
    borderColor: "rgba(0, 0, 0, 0.1)",
    ...(Platform.OS === "android" && {
      textAlignVertical: "top",
    }),
  },
  buttonModal: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  buttonAccept: {
    padding: 7,
    justifyContent: "space-between",
    backgroundColor: "#2fa360",
    marginRight: 10,
  },
  buttonClose: {
    padding: 7,
    justifyContent: "space-between",
    backgroundColor: "#6c757d",
  },
});
