import React, { useState, useEffect, useContext } from "react";
import { Text, Button } from "react-native-paper";
import TextField from "../generate/TextField";
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
  const [forClient, setForClient] = useState({ value: "", error: "" });
  const [forDelivery, setForDelivery] = useState({ value: "", error: "" });

  const [options, setOptions] = useState(
    props.deliveron?.status !== -2 && props.takeAway !== 1
      ? props.options.url_deliveronRecheck
      : props.options.url_acceptOrder
  );

  const [orderData, setOrderData] = useState({});
  const [acceptData, setAcceptData] = useState({});
  const [deliveron, setDeliveron] = useState({ data: [], error: "" });
  const [selected, setSelected] = useState(props.items ? props.items[0]?.value : null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const { dictionary } = useContext(LanguageContext);

  const deliveronOff = () => {
    let shouldReturn = false;
    if (ready === false) {
      shouldReturn = true;
    }

    if (props.deliveron?.status !== -2) {
      axiosInstance.post(props.options.url_acceptOrder, acceptData.data)
        .catch((error) => {
          console.log(error);
        });
    }

    return shouldReturn;
  };

  const acceptOrder = () => {
    if (deliveron?.data != null && selected === null) {
      setDeliveron({ ...deliveron, error: "delivery option must choose!" });
      return false;
    }

    if (options) {
      setLoading(true);
      axiosInstance.post(options, orderData.data).then(resp => {
        if (resp.data.data?.original?.status === -2 && resp.data.data?.original?.error !== "") {
          setLoading(false);
          setReady(false);
          Alert.alert("ALERT", resp.data.data.original.error, [
            { text: 'OK', onPress: () => props.hideModal() },
          ]);

          return false;
        }

        if (resp.data.data.status !== -2 || resp.data.data.status !== -1) {
          setLoading(false);
          setReady(true);
          Alert.alert("ALERT", dictionary['dv.orderSuccess'], [
            { text: 'OK', onPress: () => props.hideModal() },
          ]);
        }
      }).catch((error) => {
        console.log(error);
      });
    }
  };

  useEffect(() => {
    const shouldReturn = deliveronOff();
    if (shouldReturn) {
      return;
    }

    setReady(false);
  }, [ready]);

  useEffect(() => {
    setDeliveron({ data: props.items, error: "" });
    setSelected(props.items ? props.items[0]?.value : null);
  }, [props.deliveron]);

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
              orderDelyTime: forClient.value,
              orderPrepTime: forDelivery.value,
            },
          });

          setAcceptData({
            ...acceptData,
            data: {
              Orderid: props.itemId,
              orderPrepTime: forDelivery.value,
              orderDelyTime: forClient.value,
            },
          });
        }
      });
    } else {
      setOrderData({
        ...orderData,
        data: {
          Orderid: props.itemId,
          orderPrepTime: forDelivery.value,
        },
      });
    }
  }, [selected, forClient, forDelivery, props.deliveron, props.takeAway]);

  return (
    <>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.content}>
          {loading ? <Loader /> : null}
          <Text textColor="black" style={styles.contentTitle}>
            {dictionary["orders.approvingWarning"]}
          </Text>
          <TextField
            label={dictionary["general.AOPT"]}
            editable={true}
            clearButtonMode="always"
            value={forClient?.value || ""}
            onChangeText={(text) => setForClient({ value: text, error: "" })}
            error={!!forClient?.error}
            errorText={forClient?.error || ""}
            autoCapitalize="none"
            typeOfKeyboard="number"
          />

          {props.deliveron?.status !== -2 && props.takeAway !== 1 ? (
            <>
              <TextField
                label={dictionary["general.AOPTD"]}
                editable={true}
                clearButtonMode="always"
                value={forDelivery?.value || ""}
                onChangeText={(text) => setForDelivery({ value: text, error: "" })}
                error={!!forDelivery?.error}
                errorText={forDelivery?.error || ""}
                autoCapitalize="none"
                typeOfKeyboard="number"
              />
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
            </>
          ) : null}

          <View style={styles.buttonModal}>
            <Button
              mode="contained"
              textColor="white"
              style={styles.buttonAccept}
              onPress={acceptOrder}
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
    backgroundColor: "#fff",
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
    backgroundColor: "#fff",
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
