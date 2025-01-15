import React, { useState, useEffect, useContext } from 'react';
import { Text, Button } from 'react-native-paper';
import { StyleSheet, View, Keyboard, TouchableWithoutFeedback, Alert } from 'react-native';
import axiosInstance from "../../apiConfig/apiRequests";
import Loader from "../generate/loader";
import { String, LanguageContext } from '../Language';

export default function OrdersModalContent(props) {
  const [orderData, setOrderData] = useState({});
  const [loading, setLoading] = useState(false);
  const { dictionary } = useContext(LanguageContext);

  const rejectOrder = () => {
    setLoading(true);
    axiosInstance.post(props.options.url_rejectOrder, orderData.data).then(resp => {
      console.log(resp.data);
      setLoading(false); 
      if (resp.data.data?.status == 0 || resp.data.data?.status == -1) {
        setLoading(false);
        Alert.alert(dictionary["general.alerts"], dictionary['orders.declined'], [
          { text: dictionary["okay"], onPress: () => {
            setLoading(false); // Reset loading state
            props.hideModal();
          }},
        ]);
      }
    });
  };

  useEffect(() => {
    setOrderData({
      ...orderData, data: {
        Orderid: props.itemId,
        PendingOrders: props.PendingOrders
      }
    });
  }, [props.itemId]);

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={styles.content}>
        {loading ? <Loader /> : null}
        <Text textColor="black" style={styles.contentTitle}>{dictionary['orders.rejectionWarning']}</Text>
        <View style={styles.buttonModal}>
          <Button mode="contained" textColor="white" style={styles.buttonReject} onPress={rejectOrder}>{dictionary['orders.reject']}</Button>
          <Button mode="contained" textColor="white" style={styles.buttonClose} onPress={() => {
            setLoading(false); // Reset loading state
            props.hideModal();
          }}>{dictionary['close']}</Button>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    padding: 20,
  },
  contentTitle: {
    width: '100%',
    fontSize: 18,
    marginTop: 20,
    marginBottom: 20,
  },
  contentInput: {
    width: "100%",
    marginBottom: 25,
    paddingLeft: 1,
    fontSize: 14,
  },
  buttonModal: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  buttonReject: {
    padding: 7,
    justifyContent: "space-between",
    backgroundColor: "#f14c4c",
    marginRight: 10
  },
  buttonClose: {
    padding: 7,
    justifyContent: "space-between",
    backgroundColor: "#6c757d",
  }
});