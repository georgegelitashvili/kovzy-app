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
import * as Updates from 'expo-updates';

import { AuthContext, AuthProvider } from "../../context/AuthProvider";
import Loader from "../generate/loader";
import { String, LanguageContext } from "../Language";
import axiosInstance from "../../apiConfig/apiRequests";
import OrdersDetail from "./OrdersDetail";
import OrdersModal from "../modal/OrdersModal";
import printRows from "../../PrintRows";

import { navigate } from '../../helpers/navigate';

const width = Dimensions.get("window").width;

const numColumns = printRows(width);
const cardSize = width / numColumns;

let ordersCount;
let temp = 0;

// render entered orders function
export const EnteredOrdersList = () => {
  const { domain, branchid, setUser, user, intervalId, setIntervalId, shouldRenderAuthScreen, setShouldRenderAuthScreen } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);

  const [appState, setAppState] = useState(AppState.currentState);

  const [options, setOptions] = useState({
    url_unansweredOrders: "",
    url_deliveronRecheck: "",
    url_acceptOrder: "",
    url_rejectOrder: ""
  }); // api options
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

  const { dictionary, userLanguage } = useContext(LanguageContext);

  const onChangeModalState = (newState) => {
    console.log("modal close: ", newState);
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

  const handleReload = async () => {
    await Updates.reloadAsync();
  };

  const apiOptions = useCallback(() => {
    setOptions({
      url_unansweredOrders: `https://${domain}/api/v1/admin/getUnansweredOrders`,
      url_deliveronRecheck: `https://${domain}/api/v1/admin/deliveronRecheck`,
      url_acceptOrder: `https://${domain}/api/v1/admin/acceptOrder`,
      url_rejectOrder: `https://${domain}/api/v1/admin/rejectOrder`,
    });
    setOptionsIsLoaded(true);
  }, [domain]);

  // modal show
  const showModal = (type) => {
    setModalType(type);
    setVisible(true);
  };

  const handleNavigateToAuth = () => {
    navigate('Auth', { screen: 'Login'});
  };

  const fetchEnteredOrders = async () => {
    try {
      if (!user || !options.url_unansweredOrders) {
        return null;
      }

      const resp = await axiosInstance.post(options.url_unansweredOrders, {
        type: 0,
        page: 1,
        branchid: branchid,
      });
      const data = resp.data.data;
      setOrders(data);
    } catch (error) {
      console.log('Error fetching entered orders full:', error);
      const statusCode = error?.status || 'Unknown';
      console.log('Status code entered orders:', statusCode);
      if (statusCode === 401) {
        console.log('Error fetching entered orders:', statusCode);
        clearInterval(intervalId); // Clear the interval here
        setOrders([]);
        setOptions({});
        setOptionsIsLoaded(false);
        setIsDeliveronOptions(false);
        Alert.alert("ALERT", "your session expired", [
          {
            text: "Login", onPress: () => {
              clearInterval(intervalId);
              setShouldRenderAuthScreen(true);
            }
          },
        ]);
      } else {
        handleReload();
      }
    } finally {
      setLoading(false);
    }
  };

  const startInterval = () => {
    console.log('call interval');
    const newIntervalId = setInterval(() => {
      if (optionsIsLoaded) {
        console.log('fetchEnteredOrders called');
        fetchEnteredOrders();
      } else {
        console.log('Options not loaded');
      }
    }, 5000);

    setIntervalId(newIntervalId); // Update the intervalId state immediately
  };

  const handleAppStateChange = (nextAppState) => {
    if (appState.match(/inactive|background/) && nextAppState === "active") {
      startInterval();
    } else {
      clearInterval(intervalId);
    }
    setAppState(nextAppState);
  };

  useEffect(() => {
    if (domain && branchid) {
      apiOptions();
    } else if (domain || branchid) {
      setOptionsIsLoaded(false);
      setOrders([]);
    }
  }, [domain, branchid, apiOptions]);

  useEffect(() => {
    if (shouldRenderAuthScreen) {
      handleNavigateToAuth();
    }
  }, [shouldRenderAuthScreen]);

  useEffect(() => {
    apiOptions();

    if (optionsIsLoaded) {
      console.log('entered orders: ', intervalId);
      const subscribe = AppState.addEventListener('change', handleAppStateChange);
      console.log('Starting interval...');
      startInterval();
      console.log('Interval started.');

      return () => {
        clearInterval(intervalId); // Clear the interval in the cleanup function
        subscribe.remove();
      };
    }
  }, [optionsIsLoaded, appState]);


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
        .then((resp) => {
          return resp.data.data
        })
        .then((data) => {
          if (data.original?.content.length === 0) {
            Alert.alert("ALERT", dictionary["dv.empty"] , [
              {
                text: "okay", onPress: () => {
                  setIsDeliveronOptions(false);
                  setItemId(null);
                  setDeliveron([]);
                  console.log('deliveron null modal');
                }
              },
            ])
          }
          setDeliveron(data)
        });
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
    return <Loader show={loading} />;
  }

  if (!orders || orders.length === 0) {
    return null;
  }

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
          data={orders}
          renderItem={renderEnteredOrdersList}
          adjustGridToStyles={true}
          contentContainerStyle={{ justifyContent: "flex-start" }}
          keyExtractor={(item) => (item && item.id ? item.id.toString() : '')}
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
