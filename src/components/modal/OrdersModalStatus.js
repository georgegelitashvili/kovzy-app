import React, { useState, useEffect, useContext } from 'react';
import { Text, Button, Divider } from 'react-native-paper';
import { StyleSheet, View, Keyboard, TouchableWithoutFeedback, Alert } from 'react-native';
import axiosInstance from "../../apiConfig/apiRequests";
import Loader from "../generate/loader";
import { String, LanguageContext } from '../Language';


export default function OrdersModalContent(props) {
  const [options, setOptions] = useState(props.options.url_checkOrderStatus);
  const [acceptOptions, setAcceptOptions] = useState(props.options.url_orderPrepared);
  const [statusData, setStatusData] = useState({});
  const [status, setStatus] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");

  const { dictionary } = useContext(LanguageContext);

  const finishOrder = () => {
    setLoading(true);
      axiosInstance.post(acceptOptions, statusData.data).then(resp => {
        if (resp.data.data.status == 0) {
          setLoading(false);
          Alert.alert("ALERT", dictionary['orders.prepared'], [
            {text: 'OK', onPress: () => props.hideModal()},
          ]);
        }
      }).catch((error) => {
        console.log(error);
      });
    };

  useEffect(() => {
    if (props.deliveron?.status !== -2 && props.deliveron?.status !== -4) {
        props.orders?.map((item) => {
          if(item.id == props.itemId) {
            const deliveronId = JSON.parse(item.deliveron_data);
            if (deliveronId?.length == 0 || deliveronId['order_id_deliveron'] == null) {
             setIsDisabled(false);
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
      } else {
        setStatusData({...statusData, data: {
          Orderid: props.itemId,
        }
        });
        setIsDisabled(false);
      }
    }, [props.itemId, props.deliveron?.status])

    useEffect(() => {
      if(status) {
        axiosInstance.post(options, statusData.data).then(resp => {
          setText(resp.data.data.content);
          if (resp.data.data.status == 2 || resp.data.data.status == -1) {
            setIsDisabled(false);
            setStatusData({
              ...statusData, data: {
                Orderid: props.itemId,
              }
            });
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
          {loading ? <Loader /> : null}
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