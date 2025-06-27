import React, { useState, useEffect, useContext } from 'react';
import { Text, Button, Divider } from 'react-native-paper';
import { StyleSheet, View, Keyboard, TouchableWithoutFeedback, Alert, useWindowDimensions } from 'react-native';
import axiosInstance from "../../apiConfig/apiRequests";
import Loader from "../generate/loader";
import { String, LanguageContext } from '../Language';


export default function OrdersModalContent(props) {
  const { width, height } = useWindowDimensions();
  const [options, setOptions] = useState(props.options.url_checkOrderStatus);
  const [acceptOptions, setAcceptOptions] = useState(props.options.url_orderPrepared);
  const [statusData, setStatusData] = useState({});
  const [status, setStatus] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");

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

  const finishOrder = () => {
    setLoading(true);
      axiosInstance.post(acceptOptions, statusData.data).then(resp => {
        if (resp.data.data.status == 0) {
          setLoading(false);
          Alert.alert(dictionary["general.alerts"], dictionary['orders.prepared'], [
            { text: dictionary["okay"], onPress: () => props.hideModal()},
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
        <View style={[styles.content, { padding: contentPadding }]}>
          {loading ? <Loader /> : null}
          <Text textColor="black" style={[styles.contentTitle, { fontSize: titleFontSize }]}>
            {dictionary['orders.finishingWarning']}
          </Text>

          <Divider />
          <Text textColor="black" style={[styles.contentTitle, { fontSize: titleFontSize }]}>
            {text}
          </Text>
          <Divider />

          <View style={styles.buttonModal}>
              <Button 
                disabled={isDisabled} 
                mode="contained" 
                textColor="white" 
                style={[
                  styles.buttonAccept, 
                  { 
                    padding: buttonPadding,
                    marginRight: buttonMargin 
                  }
                ]}  
                onPress={finishOrder}
              >
                {dictionary['orders.finish']}
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
      paddingTop: 20,
      flexWrap: "wrap",
    },
    buttonAccept: {
      justifyContent: "space-between",
      backgroundColor: "#2fa360",
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