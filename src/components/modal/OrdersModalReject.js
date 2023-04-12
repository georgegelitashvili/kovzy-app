import React, { useState, useEffect, useContext } from 'react';
import { Text, Button } from 'react-native-paper';
import TextField from '../generate/TextField';
import SelectOption from '../generate/SelectOption';
import { StyleSheet, View, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Request } from "../../axios/apiRequests";
import { String, LanguageContext } from '../Language';


export default function OrdersModalContent(props) {
    const [options, setOptions] = useState(props.reject);

    const { dictionary } = useContext(LanguageContext);

    const rejectOrder = () => {
      if(options) {
        // console.log(options);
        Request(options).then(resp => {
          if(resp.status == 0) {
            alert(dictionary['orders.declined']);
          }
        });
      }
    };

    useEffect(() => {
        if(options) {
            setOptions({...options, data: {
                Orderid: props.itemId,
            }})
        }
    }, [])

    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.content}>
          <Text textColor="black" style={styles.contentTitle}>{dictionary['orders.rejectionWarning']}</Text>

            <View style={styles.buttonModal}>
              <Button mode="contained" textColor="white" style={styles.buttonReject} onPress={rejectOrder}>{dictionary['orders.reject']}</Button>
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