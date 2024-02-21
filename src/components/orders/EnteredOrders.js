import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  StyleSheet,
  Dimensions,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  AppState
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { Text, Button, Divider, Card } from "react-native-paper";
import { FlatGrid } from "react-native-super-grid";
import { MaterialCommunityIcons, SimpleLineIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";

import { AuthContext, AuthProvider } from "../../context/AuthProvider";
import Loader from "../generate/loader";
import { String, LanguageContext } from "../Language";
import axiosInstance from "../../apiConfig/apiRequests";
import OrdersDetail from "./OrdersDetail";
import OrdersModal from "../modal/OrdersModal";
import printRows from "../../PrintRows";

const width = Dimensions.get("window").width;

const numColumns = printRows(width);
const cardSize = width / numColumns;

let ordersCount;
let temp = 0;

// render entered orders function
export const EnteredOrdersList = (navigation) => {
  const { domain, branchid, login } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);

  const [appState, setAppState] = useState(AppState.currentState);
  const [intervalId, setIntervalId] = useState(null);

  const [options, setOptions] = useState({}); // api options
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false); // api options
  const [deliveronOptions, setDeliveronOptions] = useState({});
  const [isDeliveronOptions, setIsDeliveronOptions] = useState(false);

  const [deliveron, setDeliveron] = useState([]);
  const [visible, setVisible] = useState(false); // modal state
  const [itemId, setItemId] = useState(null); //item id for modal
  const [isOpen, setOpenState] = useState([]); // my accordion state
  const [modalType, setModalType] = useState("");
  const [sound, setSound] = useState(new Audio.Sound());

  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [unauthorized, setUnauthorized] = useState(false);
  const [credentials, setCredentials] = useState({});

  const { dictionary, userLanguage } = useContext(LanguageContext);

  const onChangeModalState = (newState) => {
    setTimeout(() => {
      setVisible(newState);
      setIsDeliveronOptions(newState);
      setItemId(null);
      setDeliveron([]);
    }, 0);
  };

  const toggleContent = (value) => {
    setOpenState([...isOpen, value]);

    let index = isOpen.indexOf(value);
    if (index > -1) setOpenState([...isOpen.filter((i) => i !== value)]);
  };

  const onStopPlaySound = async () => {
    sound.stopAsync();
  };

  const onPlaySound = async () => {
    const source = require("../../assets/audio/alert.mp3");
    try {
      await sound.loadAsync(source);
      await sound
        .playAsync()
        .then(async (PlaybackStatus) => {
          setTimeout(() => {
            sound.unloadAsync();
          }, PlaybackStatus.playableDurationMillis);
        })
        .catch((error) => {
          console.log(error);
        });
    } catch (error) {
      console.log(error);
    }
  };

  const orderReceived = () => {
    Alert.alert("ALERT", "***New Order Received***", [
      { text: "OK", onPress: () => onStopPlaySound() },
    ]);
  };

  const apiOptions = () => {
    setOptions({
      url_unansweredOrders: `https://${domain}/api/v1/admin/getUnansweredOrders`,
      url_deliveronRecheck: `https://${domain}/api/v1/admin/deliveronRecheck`,
      url_acceptOrder: `https://${domain}/api/v1/admin/acceptOrder`,
      url_rejectOrder: `https://${domain}/api/v1/admin/rejectOrder`,
    });
    setOptionsIsLoaded(true);
  };

  // modal show
  const showModal = (type) => {
    setModalType(type);
    setVisible(true);
  };

  const fetchEnteredOrders = async () => {
    await axiosInstance
      .post(options.url_unansweredOrders, {
        type: 0,
        page: 1,
        branchid: branchid,
      })
      .then((resp) => resp.data.data)
      .then((data) => {
        setOrders(data);
        setUnauthorized(false);
      })
      .catch((error) => {
        console.log('Error fetching entered orders:', error);
        if (error.status == 401) {
          setOrders([]);
          setOptionsIsLoaded(false);
          setUnauthorized(true);
          if (credentials) {
            Alert.alert("ALERT", "something went wrong", [
              { text: "login", onPress: () => login(credentials.username, credentials.password) },
            ]);
            setUnauthorized(false);
          }
        }
      });
    setLoading(false);
  }

  const startInterval = () => {
    const id = setInterval(async () => {
      if (optionsIsLoaded) {
        fetchEnteredOrders();
      }
    }, 5000);

    setIntervalId(id);
  };

  const handleAppStateChange = (nextAppState) => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      startInterval();
    } else {
      // App is in the background or inactive, clear or pause your interval
      clearInterval(intervalId)
    }
    setAppState(nextAppState);
  };

  useEffect(() => {
    if (domain && branchid) {
      apiOptions();
      SecureStore.getItemAsync("credentials").then((obj) => {
        if (obj) {
          setCredentials(JSON.parse(obj));
        }
      });
    } else if (domain || branchid) {
      setOptionsIsLoaded(false);
      setOrders([]);
    }
  }, [domain, branchid]);

  // setinterval
  useEffect(() => {
    if (!unauthorized) {
    // Subscribe to app state changes
      const subscribe = AppState.addEventListener('change', handleAppStateChange);
      startInterval();

    // Clear the interval and remove the event listener when component unmounts
    return () => {
      clearInterval(intervalId);
      subscribe.remove();
      };
    }
  }, [optionsIsLoaded, unauthorized, appState]);

  // set deliveron data
  useEffect(() => {
    if (itemId) {
      setDeliveronOptions((prev) => ({ ...prev, data: { orderId: itemId } }));
      setIsDeliveronOptions(true);
      setLoadingOptions(true);
    }
  }, [itemId]);

  useEffect(() => {
    if (isDeliveronOptions) {
      axiosInstance
        .post(options.url_deliveronRecheck, deliveronOptions.data)
        .then((resp) => {setDeliveron(resp.data.data)});
    }
  }, [isDeliveronOptions]);

  useEffect(() => {
    if (deliveron || deliveron.original) {
      setLoadingOptions(false);
    }
  }, [deliveron, deliveron.original]);

  useEffect(() => {
    if (orders) {
      ordersCount = Object.keys(orders).length;
      if (ordersCount > temp) {
        onPlaySound();
        orderReceived();
      }
      temp = ordersCount;
    }
  }, [orders]);


  const renderEnteredOrdersList = ({ item }) => {
    return (
      <Card key={item.id}>
        <TouchableOpacity onPress={() => toggleContent(item.id)}>
          <Card.Content style={styles.head}>
            <Text variant="headlineMedium" style={styles.header}>
              <MaterialCommunityIcons
                name="music-accidental-sharp"
                style={styles.leftIcon}
              />
              {item.id}
            </Text>
            <Text variant="headlineMedium" style={styles.header}>
              <SimpleLineIcons
                name={!isOpen.includes(item.id) ? "arrow-up" : "arrow-down"}
                style={styles.rightIcon}
              />
            </Text>
          </Card.Content>
        </TouchableOpacity>
        {!isOpen.includes(item.id) ? (
          <Card.Content>
            <Text variant="titleSmall" style={styles.title}>
              {dictionary["orders.status"]}: {dictionary["orders.pending"]}
            </Text>

            <Text variant="titleSmall" style={styles.title}>
              {dictionary["orders.fName"]}: {item.firstname} {item.lastname}
            </Text>

            <Text variant="titleSmall" style={styles.title}>
              {dictionary["orders.phone"]}: {item.phone_number}
            </Text>

            <Text variant="titleSmall" style={styles.title}>
              {dictionary["orders.address"]}: {item.address}
            </Text>

            {item.delivery_scheduled ? (
              <Text variant="titleSmall" style={styles.title}>
                {dictionary["orders.scheduledDeliveryTime"]}: {item.delivery_scheduled}
              </Text>
            ) : null}

            {item.comment ? (
              <Text variant="titleSmall" style={styles.title}>
                {dictionary["orders.comment"]}: {item.comment}
              </Text>
            ) : null}

            <Divider />
            <OrdersDetail orderId={item.id} />
            <Divider />

            <Text variant="titleLarge">{item.price} GEL</Text>

            <Card.Actions>
              <Button
                textColor="white"
                buttonColor="#2fa360"
                onPress={() => {
                  setItemId(item.id);
                  showModal("accept");
                }}
              >
                {dictionary["orders.accept"]}
              </Button>
              <Button
                textColor="white"
                buttonColor="#f14c4c"
                onPress={() => {
                  setItemId(item.id);
                  showModal("reject");
                }}
              >
                {dictionary["orders.reject"]}
              </Button>
            </Card.Actions>
          </Card.Content>
        ) : null}
      </Card>
    )
  };

  if (loading) {
    return <Loader />;
  }

  console.log('------------ entered orders');
  // console.log(domain);
  // console.log(orders);
  // console.log(branchid);
  // console.log(optionsIsLoaded);
  console.log(unauthorized);
  console.log(appState);
  console.log('------------ end entered orders');

  return (
    <View>
      {loadingOptions ? <Loader /> : null}
      <ScrollView horizontal={true} showsVerticalScrollIndicator={false}>
        {visible ? (
          <OrdersModal
            isVisible={visible}
            onChangeState={onChangeModalState}
            orders={orders}
            hasItemId={itemId}
            deliveron={deliveron ?? null}
            deliveronOptions={deliveronOptions}
            type={modalType}
            options={options}
          />
        ) : null}
        <FlatGrid
          itemDimension={cardSize}
          data={orders || []}
          renderItem={renderEnteredOrdersList}
          adjustGridToStyles={true}
          contentContainerStyle={{ justifyContent: "flex-start" }}
          keyExtractor={(item) => item.id.toString()}
          onEndReachedThreshold={0.5}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 12,
    justifyContent: "flex-start",
  },
  card: {
    backgroundColor: "#fff",
    justifyContent: "flex-start",

    margin: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,

    elevation: 8,
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  header: {
    paddingVertical: 10,
  },
  leftIcon: {
    marginRight: 3,
    fontSize: 32,
  },
  rightIcon: {
    marginRight: 15,
    fontSize: 25,
  },
  title: {
    paddingVertical: 10,
  },
});
