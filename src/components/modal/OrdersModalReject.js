import React, { useState, useEffect, useContext } from 'react';
import { Text, Button } from 'react-native-paper';
import { StyleSheet, View, Keyboard, TouchableWithoutFeedback, Alert, useWindowDimensions } from 'react-native';
import axiosInstance from "../../apiConfig/apiRequests";
import Loader from "../generate/loader";
import { String, LanguageContext } from '../Language';


export default function OrdersModalContent(props) {
  const { width, height } = useWindowDimensions();
  const [orderData, setOrderData] = useState({});
  const [loading, setLoading] = useState(false);
  const { dictionary } = useContext(LanguageContext);

  // Calculate responsive dimensions
  const isSmallScreen = width < 400;
  const isMediumScreen = width >= 400 && width < 600;
  const isLargeScreen = width >= 600;
  const isLandscape = width > height;

  const contentPadding = isSmallScreen ? 15 : isMediumScreen ? 18 : 20;
  const buttonPadding = isSmallScreen ? 5 : isMediumScreen ? 6 : 7;
  const buttonMargin = isSmallScreen ? 8 : isMediumScreen ? 9 : 10;
  const titleFontSize = isSmallScreen ? 16 : isMediumScreen ? 17 : 18;
  const inputFontSize = isSmallScreen ? 13 : 14;

  const rejectOrder = () => {
    setLoading(true);
    axiosInstance.post(props.options.url_rejectOrder, orderData.data).then(resp => {
      console.log(resp.data);
      if (resp.data.data?.status == 0 || resp.data.data?.status == -1) {
        setLoading(false);
        Alert.alert(dictionary["general.alerts"], dictionary['orders.declined'], [
            { text: dictionary["okay"], onPress: () => props.hideModal()},
          ]);
        }
      });
    };

  useEffect(() => {
    if (props.deliveron?.status !== -2 && props.deliveron?.status !== -4) {
      props.orders?.map((item) => {
        if (item.id == props.itemId) {
          const deliveronId = JSON.parse(item.deliveron_data);
          setOrderData({
            ...orderData, data: {
              Orderid: props.itemId,
              deliveronOrderId: deliveronId['order_id_deliveron'] ?? null,
              PendingOrders: props.PendingOrders
            }
          })
        }
      })
    } else {
      setOrderData({
        ...orderData, data: {
          Orderid: props.itemId,
          PendingOrders: props.PendingOrders
        }
      })
    }
  }, [props.itemId, props.deliveron.status])

    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={[styles.content, { padding: contentPadding }]}>
          {loading ? <Loader /> : null}
          <Text textColor="black" style={[styles.contentTitle, { fontSize: titleFontSize }]}>
            {dictionary['orders.rejectionWarning']}
          </Text>

            <View style={styles.buttonModal}>
              <Button 
                mode="contained" 
                textColor="white" 
                style={[
                  styles.buttonReject, 
                  { 
                    padding: buttonPadding,
                    marginRight: buttonMargin 
                  }
                ]} 
                onPress={rejectOrder}
              >
                {dictionary['orders.reject']}
              </Button>
              <Button 
                mode="contained" 
                textColor="white" 
                style={[
                  styles.buttonClose, 
                  { padding: buttonPadding }
                ]} 
                onPress={props.hideModal}
              >
                {dictionary['close']}
              </Button>
          </View>
        </View>
        </TouchableWithoutFeedback>
    );
  };


  const styles = StyleSheet.create({
    content: {
      width: '100%',
    },
    contentTitle: {
      width: '100%',
      marginTop: 20,
      marginBottom: 20,
      fontWeight: "500",
    },
    contentInput: {
      width: "100%",
      marginBottom: 25,
      paddingLeft: 1,
    },
    buttonModal: {
      flexDirection: "row",
      justifyContent: "space-around",
      flexWrap: "wrap",
    },
    buttonReject: {
      justifyContent: "space-between",
      backgroundColor: "#f14c4c",
      borderRadius: 8,
      minWidth: 100,
    },
    buttonClose: {
      justifyContent: "space-between",
      backgroundColor: "#6c757d",
      borderRadius: 8,
      minWidth: 100,
    }
  });