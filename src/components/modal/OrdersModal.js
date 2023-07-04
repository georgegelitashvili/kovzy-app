import React, { useCallback, useState } from "react";
import { Text, Button } from "react-native-paper";
import { StyleSheet, View, Dimensions } from "react-native";
import Modal from "react-native-modal";
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
  options
}) {
  const [visible, setVisible] = useState(isVisible); // modal state

  const hideModal = useCallback(() => {
    setVisible(false);
  });

  const handleChangeStateClick = useCallback(() => {
    onChangeState(visible);
  });

  // console.log('---------- type');
  // console.log(options);
  // console.log('---------- end type');

  const loadModalComponent = () => {
    switch(type) {
      case 'accept':
        return (
          <OrdersModalAccept
            itemId={hasItemId}
            deliveron={deliveron}
            deliveronOptions={deliveronOptions}
            options={options}
            items={
              deliveron.status === 0 ? deliveron.content?.map((item) => ({
                label: item.companyName + ' - ' + item.price,
                value: item.companyId ?? item.type,
              })) : null
            }
            hideModal={hideModal}
          />
        )
      case 'reject':
        return (
          <OrdersModalReject
            itemId={hasItemId}
            options={options}
            hideModal={hideModal}
          />
        )
      case 'status':
        return (
          <OrdersModalStatus
            itemId={hasItemId}
            orders={orders}
            deliveron={deliveron}
            options={options}
            deliveronOptions={deliveronOptions}
            hideModal={hideModal}
          />
        )
    }
  }

  if (deliveron?.length == 0) {
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
