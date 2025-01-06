import React, { useState, useEffect, useContext } from "react";
import { Text, Button } from "react-native-paper";
import SelectOption from "../generate/SelectOption";
import Loader from "../generate/loader";
import {
  StyleSheet,
  View,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import axiosInstance from "../../apiConfig/apiRequests";
import { String, LanguageContext } from "../Language";

export default function OrdersModalContent(props) {
  const [orderData, setOrderData] = useState({});
  const [acceptData, setAcceptData] = useState({});
  const [deliveron, setDeliveron] = useState({ data: [], error: "" });
  const [selected, setSelected] = useState(props.items ? props.items[0]?.value : null);
  const [loading, setLoading] = useState(false);
  const { dictionary } = useContext(LanguageContext);

  // console.log(props.forDelivery);
  const acceptOrder = async () => {
    if (props.takeAway !== 1 && props.deliveron?.status !== -2 && deliveron?.data != null && selected === null) {
      setDeliveron({ ...deliveron, error: "Delivery option must be chosen!" });
      return;
    }

    setLoading(true);

    try {
      console.log("orderData:", orderData.data);
      // Step 1: Send `url_deliveronRecheck` request if deliveron is enabled
      if (props.deliveron?.status !== -2 && props.takeAway !== 1) {
        const recheckResponse = await axiosInstance.post(props.options.url_deliveronRecheck, orderData.data);

        // Check for error in the response
        if (recheckResponse.data.data?.original?.status === -2 && recheckResponse.data.data?.original?.error) {
          Alert.alert(dictionary["general.alerts"], recheckResponse.data.data.original.error, [
            { text: dictionary["okay"], onPress: () => props.hideModal() },
          ]);
          setLoading(false);
          return;
        }
      }

      // Step 2: Send `url_acceptOrder` request (either directly or after successful recheck)
      await axiosInstance.post(props.options.url_acceptOrder, acceptData.data);

      Alert.alert(dictionary["general.alerts"], dictionary['dv.orderSuccess'], [
        { text: dictionary["okay"], onPress: () => props.hideModal() },
      ]);
    } catch (error) {
      console.log("Error in acceptOrder:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (props.items) {
      setDeliveron({ data: props.items, error: "" });
      setSelected(props.items[0]?.value || null);
    }
  }, [props.deliveron, props.items]);


  useEffect(() => {
    if (props.takeAway !== 1 && selected && props.deliveron.content) {
      const contentArray = Array.isArray(props.deliveron.content) ? props.deliveron.content : [props.deliveron.content];
      contentArray.forEach((item) => {
        if (item.id == selected || item.companyId == selected || item.type == selected) {
          setOrderData({
            ...orderData,
            data: {
              deliveronOrder: 1,
              orderId: props.itemId,
              offer_id: item.id ?? null,
              companyId: item.companyId,
              companyName: item.name ?? item.companyName,
              type: item.type == "glovo" || item.type == "wolt" ? item.type : item.type,
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
        }
      });
    } else {
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
    }
  }, [selected, props.forDelivery, props.deliveron, props.takeAway]);

  return (
    <>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.content}>
          {loading ? <Loader /> : null}

          {props.deliveron?.status !== -2 && props.takeAway !== 1 ? (
            <SelectOption
              value={selected}
              onValueChange={(value) => {
                setSelected(value);
                setDeliveron({ ...deliveron, error: "" });
              }}
              items={deliveron?.data || []}
              key={(item) => item?.id || ""}
              error={!!deliveron?.error}
              errorText={deliveron?.error || ""}
            />
          ) : null}

          <View style={styles.buttonModal}>
            <Button
              mode="contained"
              textColor="white"
              style={styles.buttonAccept}
              onPress={acceptOrder}
              disabled={
                (Array.isArray(props.deliveron) && props.deliveron.length === 0) &&
                !(props.takeAway === 1 || props.takeAway === null)
              }
            >
              {dictionary["orders.approve"]}
            </Button>
            <Button
              mode="contained"
              textColor="white"
              style={styles.buttonClose}
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
    padding: 20,
  },
  contentTitle: {
    width: "100%",
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
    paddingTop: 20
  },
  buttonAccept: {
    padding: 7,
    justifyContent: "space-between",
    backgroundColor: "#2fa360",
    marginRight: 10,
  },
  buttonClose: {
    padding: 7,
    justifyContent: "space-between",
    backgroundColor: "#6c757d",
  },
});
