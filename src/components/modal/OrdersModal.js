import React, { useState} from 'react';
import { Text, TextInput, Button } from 'react-native-paper';
import { StyleSheet, View, Keyboard, TouchableWithoutFeedback } from 'react-native';
import Modal from "react-native-modal";
import OrdersModalContent from "./OrdersModalContent";


export default function OrdersModal({ isVisible, onChangeState }) {
    const [visible, setVisible] = useState(isVisible); // modal state
    const hideModal = () => setVisible(false);

    const handleChangeStateClick = () => {
      onChangeState(visible);
    };

    return (
      <>
      {visible === false ? handleChangeStateClick() : null}

      <View  style={styles.modal}>
        <Modal
          isVisible={visible}
          backdropColor="#141414"
          backdropOpacity={0.8}
          animationIn="zoomInDown"
          animationOut="zoomOutUp"
          animationInTiming={600}
          animationOutTiming={600}
          backdropTransitionInTiming={600}
          backdropTransitionOutTiming={600}
        >
          <OrdersModalContent />
          <View style={styles.buttonModal}>
            <Button mode="contained" style={styles.buttonAccept}>accept</Button>
            <Button mode="contained" style={styles.buttonClose} onPress={hideModal}>დახურვა</Button>
          </View>
        </Modal>
      </View>
      </>
    );
  };


  const styles = StyleSheet.create({
    modal: {
        position: "relative"
      },
      buttonModal: {
        flexDirection: "row",
        justifyContent: "space-around",
        position: "absolute",
        top: "70%",
        right: 20
      },
      buttonAccept: {
        padding: 7,
        justifyContent: "space-between",
        backgroundColor: "#2fa360",
        marginRight: 10
      },
      buttonClose: {
        padding: 7,
        justifyContent: "space-between",
        backgroundColor: "#6c757d",
      }
  });