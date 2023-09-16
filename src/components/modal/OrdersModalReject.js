import React, { useState, useEffect, useContext } from 'react';
import { Text, Button } from 'react-native-paper';
import { StyleSheet, View, Keyboard, TouchableWithoutFeedback, Alert } from 'react-native';
import axiosInstance from "../../apiConfig/apiRequests";
import { String, LanguageContext } from '../Language';


export default function OrdersModalContent(props) {
    const [options, setOptions] = useState(props.options.url_rejectOrder);
    const [orderData, setOrderData] = useState({});

  const { dictionary } = useContext(LanguageContext);

  const rejectOrder = () => {
      axiosInstance.post(options, orderData.data).then(resp => {
        if(resp.data.data.status == 0) {
          Alert.alert("ALERT", dictionary['orders.declined'], [
            {text: 'OK', onPress: () => props.hideModal()},
          ]);
        }
      });
    };

  useEffect(() => {
    if (props.deliveron?.status !== -2) {
      props.orders?.map((item) => {
        if (item.id == props.itemId) {
          const deliveronId = JSON.parse(item.deliveron_data);
          if (deliveronId?.length == 0 || deliveronId['order_id_deliveron'] == null) {
            setOrderData({
              ...orderData, data: {
                Orderid: props.itemId,
                deliveronOrderId: deliveronId['order_id_deliveron'],
              }
            })
          } else {
            setOrderData({
              ...orderData, data: {
                Orderid: props.itemId,
                deliveronOrderId: deliveronId['order_id_deliveron'],
              }
            })
          }

        }
      })
    } else {
      setOrderData({
        ...orderData, data: {
          Orderid: props.itemId,
        }
      })
    }
  }, [props.itemId, props.deliveron.status])

    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.content}>
          <Text textColor="black" style={styles.contentTitle}>{dictionary['orders.rejectionWarning']}</Text>

            <View style={styles.buttonModal}>
              <Button mode="contained" textColor="white" style={styles.buttonReject} onPress={rejectOrder}>{dictionary['orders.reject']}</Button>
              <Button mode="contained" textColor="white" style={styles.buttonClose} onPress={props.hideModal}>{dictionary['close']}</Button>
          </View>
        </View>
        </TouchableWithoutFeedback>
    );
  };


  const styles = StyleSheet.create({
    content: {
      backgroundColor: '#fff',
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
      backgroundColor: "#fff",
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