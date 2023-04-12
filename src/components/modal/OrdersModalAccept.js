import React, { useState, useEffect, useContext } from 'react';
import { Text, Button } from 'react-native-paper';
import TextField from '../generate/TextField';
import SelectOption from '../generate/SelectOption';
import Loader from "../generate/loader";
import { StyleSheet, View, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Request } from "../../axios/apiRequests";
import { String, LanguageContext } from '../Language';


export default function OrdersModalContent(props) {
    const [forClient, setForClient] = useState({value: '', error: ''});
    const [forDelivery, setForDelivery] = useState({value: '', error: ''});
    const [options, setOptions] = useState(props.deliveron.status === 0 ? props.deliveronOptions : props.accept);

    const [deliveron, setDeliveron] = useState({data: props.items, error: ''});
    const [selected, setSelected] = useState(null);

    const [loading, setLoading] = useState(false);

    // console.log(props.deliveron);

    const { dictionary } = useContext(LanguageContext);

    const acceptOrder = () => {
      if(options) {
        // console.log(options);
        // return;
        setLoading(true);
        Request(options).then(resp => {
          if(resp.status == 0) {
            setLoading(false);
            alert(dictionary['dv.orderSuccess']);
          }
        });
      }
    };

    useEffect(() => {
      if(selected) {
        props.deliveron.content?.map((item) => {
          if(item.companyId == selected) {
            // console.log(item);
            setOptions({...options, data: {
              deliveronOrder: 1,
              orderId: props.itemId,
              Orderid: props.itemId,
              offer_id: item.id,
              companyId: item.companyId,
              companyName: item.companyName,
              type: (item.type == 'glovo' || item.type == 'wolt') ? item.type : '',
              orderDelyTime: forDelivery.value,
              orderPrepTime: forClient.value
            }})
          }
        })
      }else {
        setOptions({...options, data: {
          Orderid: props.itemId,
          orderPrepTime: forClient.value
        }
      })
      }
    }, [selected, forClient])

    return (
      <>

        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.content}>
        {loading ? <Loader text="Preparing order"/> : null}
          <Text textColor="black" style={styles.contentTitle}>{dictionary['orders.approvingWarning']}</Text>
          <TextField
              label={dictionary['general.AOPT']}
              editable={true}
              clearButtonMode='always'
              value={forClient?.value || ''}
              onChangeText={(text) => setForClient({ value: text, error: '' })}
              error={!!forClient?.error}
              errorText={forClient?.error || ''}
              autoCapitalize="none"
              typeOfKeyboard="number"
              />

              {props.deliveron.status === 0 ? (
                <>
                  <TextField
                    label={dictionary['general.AOPTD']}
                    editable={true}
                    clearButtonMode='always'
                    value={forDelivery?.value || ''}
                    onChangeText={(text) => setForDelivery({ value: text, error: '' })}
                    error={!!forDelivery?.error}
                    errorText={forDelivery?.error || ''}
                    autoCapitalize="none"
                    typeOfKeyboard="number"
                  />
                  <SelectOption
                    value={selected}
                    onValueChange={(value) => {setSelected(value);setDeliveron({ ...deliveron, error: '' });}}
                    items={deliveron?.data || ''}
                    key={(item)=> item?.id || ''}
                    error={!!deliveron?.error}
                    errorText={deliveron?.error || ''}
                  />
                </>
              ) : null}

            <View style={styles.buttonModal}>
              <Button mode="contained" textColor="white" style={styles.buttonAccept} onPress={acceptOrder}>{dictionary['orders.approve']}</Button>
              <Button mode="contained" textColor="white" style={styles.buttonClose} onPress={props. hideModal}>{dictionary['close']}</Button>
          </View>
        </View>
        </TouchableWithoutFeedback>

      </>

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