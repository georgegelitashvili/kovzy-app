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
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const { dictionary } = useContext(LanguageContext);

  useEffect(() => {    
    if (props.takeAway === 1) {
      setDeliveron({ data: [], error: "" });
      return;
    }
    
    if (props.deliveron?.content && 
        ((Array.isArray(props.deliveron.content) && props.deliveron.content.length > 0) || 
         (typeof props.deliveron.content === 'object' && Object.keys(props.deliveron.content).length > 0))) {
      const content = Array.isArray(props.deliveron.content) ? props.deliveron.content : [props.deliveron.content];
      setDeliveron({ data: content, error: "" });
      if (content.length > 0) {
        setSelected(content[0]?.id || content[0]?.companyId || content[0]?.type || null);
      }
    } else if (props.deliveron?.status === undefined && props.takeAway !== 1 && 
      (!props.deliveron?.content || 
       (typeof props.deliveron.content === 'string') ||
       (Array.isArray(props.deliveron.content) && props.deliveron.content.length === 0) || 
       (typeof props.deliveron.content === 'object' && Object.keys(props.deliveron.content).length === 0) ||
       props.deliveron?.response?.data?.original?.error || 
       props.deliveron?.content === undefined || 
       props.deliveron?.content === null)) {
      Alert.alert(
        dictionary["general.alerts"],
        dictionary["dv.empty"],
        [{ text: dictionary["okay"], onPress: () => props.hideModal() }]
      );
      props.hideModal();
    }
  }, [props.deliveron]);

  useEffect(() => {
    if (props.takeAway !== 1 && selected && deliveron.data) {
      const contentArray = Array.isArray(deliveron.data) ? deliveron.data : [deliveron.data];
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
  }, [selected, props.forDelivery, props.takeAway, deliveron.data]);

  const acceptOrder = async () => {
    if (props.takeAway !== 1 && props.deliveron?.status !== -2 && deliveron?.data != null && selected === null) {
      setDeliveron({ ...deliveron, error: "Delivery option must be chosen!" });
      return;
    }

    setLoading(true);

    try {
      // Step 1: Send `url_deliveronRecheck` request if deliveron is enabled and not takeaway
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

      // Step 2: Send `url_acceptOrder` request
      const acceptResponse = await axiosInstance.post(props.options.url_acceptOrder, acceptData.data);

      if (acceptResponse.data.data?.original?.status === -2 && acceptResponse.data.data?.original?.error !== "") {
        setLoading(false);
        setReady(false);
        Alert.alert("ALERT", acceptResponse.data.data.original.error, [
          { text: 'OK', onPress: () => props.hideModal() },
        ]);

        return false;
      }

      Alert.alert(dictionary["general.alerts"], dictionary['dv.orderSuccess'], [
        { text: dictionary["okay"], onPress: () => props.hideModal() },
      ]);
    } catch (error) {
      Alert.alert(dictionary["general.alerts"], "შეცდომა მოხდა. გთხოვთ სცადოთ თავიდან.", [
        { text: dictionary["okay"], onPress: () => props.hideModal() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.content}>
          {loading && <Loader />}

          {props.deliveron?.status !== -2 && props.takeAway !== 1 ? (
            <SelectOption
              value={selected}
              onValueChange={(value) => {
                setSelected(value);
                setDeliveron({ ...deliveron, error: "" });
              }}
              items={deliveron?.data || []}
              key={(item) => item?.id || item?.companyId || item?.type || ""}
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
              disabled={loading || (
                props.deliveron?.status === 1 && 
                props.takeAway !== 1 && 
                deliveron?.data?.length === 0
              )}
            >
              {loading ? "მიღება..." : dictionary["orders.approve"]}
            </Button>
            <Button
              mode="contained"
              textColor="white"
              style={styles.buttonClose}
              onPress={props.hideModal}
              disabled={loading}
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
