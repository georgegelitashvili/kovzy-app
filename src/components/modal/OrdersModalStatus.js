import React, { useState, useEffect, useContext } from 'react';
import { Text, Button } from 'react-native-paper';
import { StyleSheet, View, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Request } from "../../axios/apiRequests";
import { String, LanguageContext } from '../Language';


export default function OrdersModalContent(props) {
    const [options, setOptions] = useState(props.deliveronOptions);
    const [acceptOptions, setAcceptOptions] = useState(props.accept);
    const [status, setStatus] = useState({});
    const [isDisabled, setDisabled] = useState(false);

    const { dictionary } = useContext(LanguageContext);

    const finishOrder = () => {
      if(options) {
        console.log(options);
        return;
        Request(options).then(resp => {
          if(resp.status == 0) {
            alert(dictionary['orders.declined']);
          }
        });
      }
    };

    useEffect(() => {
      if(options) {
        if(props.deliveron.status == 0) {
          props.orders?.map((item) => {
            if(item.id == props.itemId) {
              const deliveronId = JSON.parse(item.deliveron_data);
              if(deliveronId?.length == 0 || deliveronId['order_id_deliveron'] == null) {
                setOptions({...props.accept, data: {
                  Orderid: props.itemId,
              }})
              }else {
                setOptions({...options, data: {
                  deliveronOrderId: deliveronId['order_id_deliveron'],
              }})
              }

            }
          })
        }else {
          setOptions({...props.accept, data: {
            Orderid: props.itemId,
        }})
        }
      }
    }, [props.itemId, props.deliveron.status])

    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.content}>
          <Text textColor="black" style={styles.contentTitle}>{dictionary['orders.finishingWarning']}</Text>

            <View style={styles.buttonModal}>
              <Button mode="contained" textColor="white" style={styles.buttonAccept} onPress={finishOrder} disabled={isDisabled}>{dictionary['orders.finish']}</Button>
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