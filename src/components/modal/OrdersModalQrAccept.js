import React, { useState, useEffect, useContext } from "react";
import { Text, Button } from "react-native-paper";
import Loader from "../generate/loader";
import {
  StyleSheet,
  View,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  useWindowDimensions,
} from "react-native";
import axiosInstance from "../../apiConfig/apiRequests";
import { String, LanguageContext } from "../Language";

export default function OrdersModalContent(props) {
  const { width, height } = useWindowDimensions();
  const [orderData, setOrderData] = useState({});
  const [acceptData, setAcceptData] = useState({});
  const [selected, setSelected] = useState(props.items ? props.items[0]?.value : null);
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

  // console.log(props.forDelivery);
  const acceptOrder = async () => {

    setLoading(true);

    try {
      console.log("orderData:", orderData.data);
      // Step 1: Send `url_deliveronRecheck` request if deliveron is enabled

      // Step 2: Send `url_acceptOrder` request (either directly or after successful recheck)
      await axiosInstance.post(props.options.url_acceptOrder, acceptData.data);

      Alert.alert(dictionary["general.alerts"], dictionary['dv.orderSuccess'], [
        { text: dictionary["okay"], onPress: () => props.hideModal() },
      ]);
      setLoading(false);
    } catch (error) {
      console.log("Error in acceptOrder:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (props.items) {
      setSelected(props.items[0]?.value || null);
    }
  }, [props.items]);


  useEffect(() => {
      setOrderData({
        ...orderData,
        data: {
          Orderid: props.itemId,
          orderDelyTime: props.forDelivery !== 0 ? props.forDelivery : null,
        },
      });
      setAcceptData({
        ...acceptData,
        data: {
          Orderid: props.itemId,
          orderDelyTime: props.forDelivery !== 0 ? props.forDelivery : null,
        },
      });
  }, [selected, props.forDelivery, props.takeAway]);

  return (
    <>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={[styles.content, { padding: contentPadding }]}>
          {loading ? <Loader /> : null}

          <View style={styles.buttonModal}>
            <Button
              mode="contained"
              textColor="white"
              style={[
                styles.buttonAccept, 
                { 
                  padding: buttonPadding,
                  marginRight: buttonMargin 
                }
              ]}
              onPress={acceptOrder}
            >
              {dictionary["orders.approve"]}
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
              {dictionary["close"]}
            </Button>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
  },
  contentTitle: {
    width: "100%",
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
  },
});
