import React, { useState, useEffect, useContext } from 'react';
import { Text, Button, Divider } from 'react-native-paper';
import { StyleSheet, View, Keyboard, TouchableWithoutFeedback, Alert } from 'react-native';
import axiosInstance from "../../apiConfig/apiRequests";
import { String, LanguageContext } from '../Language';


export default function OrdersModalContent(props) {
    const [options, setOptions] = useState(props.options.url_checkOrderStatus);
    const [acceptOptions, setAcceptOptions] = useState(props.options.url_orderPrepared);
    const [statusData, setStatusData] = useState({});
    const [status, setStatus] = useState(false);
    const [isDisabled, setIsDisabled] = useState(true);
    const [text, setText] = useState("");

    const { dictionary } = useContext(LanguageContext);

    const finishOrder = () => {
      axiosInstance.post(acceptOptions, statusData.data).then(resp => {
        if(resp.data.data.status == 0) {
          Alert.alert("ALERT", dictionary['orders.prepared'], [
            {text: 'OK', onPress: () => props.hideModal()},
          ]);
        }
      });
    };

    useEffect(() => {
      if(props.deliveron.status == 0) {
        props.orders?.map((item) => {
          if(item.id == props.itemId) {
            const deliveronId = JSON.parse(item.deliveron_data);
            if(deliveronId?.length == 0 || deliveronId['order_id_deliveron'] == null) {
              setStatusData({...statusData, data: {
                Orderid: props.itemId,
              }})
            }else {
              setStatusData({...statusData, data: {
                deliveronOrderId: deliveronId['order_id_deliveron'],
              }})
              setStatus(true);
            }

          }
        })
      }else {
        setStatusData({...statusData, data: {
          Orderid: props.itemId,
        }});
        setIsDisabled(false);
      }
    }, [props.itemId, props.deliveron.status])

    useEffect(() => {
      if(status) {
        axiosInstance.post(options, statusData.data).then(resp => {
          setText(resp.data.data.content);
          if (resp.data.data.status == 2 || resp.data.data.status == -1) {
            setIsDisabled(false);
          } else {
            setIsDisabled(true);
          }
        });
        setStatus(false);
      }
    }, [status])

    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.content}>
          <Text textColor="black" style={styles.contentTitle}>{dictionary['orders.finishingWarning']}</Text>

          <Divider />
          <Text textColor="black" style={styles.contentTitle}>{text}</Text>
          <Divider />

          <View style={styles.buttonModal}>
              <Button disabled={isDisabled} mode="contained" textColor="white" style={styles.buttonAccept}  onPress={finishOrder}>{dictionary['orders.finish']}</Button>

              <Button mode="contained" textColor="white" style={styles.buttonClose} onPress={props. hideModal}>{dictionary['close']}</Button>
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
      paddingTop: 20,
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