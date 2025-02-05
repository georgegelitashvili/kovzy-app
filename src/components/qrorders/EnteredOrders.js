import React, { useState, useEffect, useCallback, useContext, useRef } from "react";
import {
  StyleSheet,
  Dimensions,
  View,
  Modal,
  TouchableOpacity,
  Alert,
  AppState,
  FlatList
} from "react-native";

import { Text, Button, Divider, Card } from "react-native-paper";
import { FlatGrid } from "react-native-super-grid";
import { MaterialCommunityIcons, SimpleLineIcons } from "@expo/vector-icons";
import * as Updates from 'expo-updates';

import { AuthContext, AuthProvider } from "../../context/AuthProvider";
import Loader from "../generate/loader";
import TimePicker from "../generate/TimePicker";
import { String, LanguageContext } from "../Language";
import axiosInstance from "../../apiConfig/apiRequests";
import OrdersDetail from "./OrdersDetail";
import OrdersModal from "../modal/OrdersModalQr";
import printRows from "../../PrintRows";

import NotificationSound from '../../utils/NotificationSound';
import NotificationManager from '../../utils/NotificationManager';


const width = Dimensions.get("window").width;
const numColumns = printRows(width);
const cardSize = width / numColumns;

const type = 1;

// render entered orders function
export const EnteredOrdersList = () => {
  const { domain, branchid, user, intervalId, setIntervalId } = useContext(AuthContext);
  const [isNotificationReady, setIsNotificationReady] = useState(false);
  const NotificationSoundRef = useRef(NotificationSound);
  const [orders, setOrders] = useState([]);
  const [fees, setFees] = useState([]);
  const [currency, setCurrency] = useState("");
  const [scheduled, setScheduled] = useState([]);
  const [appState, setAppState] = useState(AppState.currentState);
  const [options, setOptions] = useState({
    url_unansweredOrders: "",
    url_acceptOrder: "",
    url_rejectOrder: "",
    url_pushToken: ""
  });
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  const [itemId, setItemId] = useState(null);
  const [itemTakeAway, setItemTakeAway] = useState(null);
  const [isOpen, setOpenState] = useState([]);
  const [modalType, setModalType] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [width, setWidth] = useState(Dimensions.get('window').width);
  const [numColumns, setNumColumns] = useState(printRows(width));
  const [cardSize, setCardSize] = useState(width / numColumns);
  const [previousOrderCount, setPreviousOrderCount] = useState(0);

  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 5000;

  const { dictionary, languageId } = useContext(LanguageContext);

  const onChangeModalState = (newState) => {
    console.log("modal close: ", newState);
    setTimeout(() => {
      setVisible(false);
      setLoadingOptions(false);
      setLoading(false);
      setItemId(null);
    }, 0);
  };

  const toggleContent = (value) => {
    setOpenState([...isOpen, value]);
    let index = isOpen.indexOf(value);
    if (index > -1) setOpenState([...isOpen.filter((i) => i !== value)]);
  };

  const handleReload = async () => {
    await Updates.reloadAsync();
  };

  const apiOptions = useCallback(() => {
    setOptions({
      url_unansweredOrders: `https://${domain}/api/v1/admin/getUnansweredOrders`,
      url_acceptOrder: `https://${domain}/api/v1/admin/acceptOrder`,
      url_rejectOrder: `https://${domain}/api/v1/admin/rejectOrder`,
      url_pushToken: `https://${domain}/api/v1/admin/storePushToken`,
    });
    setOptionsIsLoaded(true);
  }, [domain]);

  const showModal = (type) => {
    setModalType(type);
    setVisible(true);
  };

  useEffect(() => {
    if (!NotificationSoundRef?.current) {
      console.warn('NotificationSoundRef not ready');
      return;
    }

    setIsNotificationReady(true);

    return () => {
      setIsNotificationReady(false);
    };
  }, [NotificationSoundRef]);

  useEffect(() => {
    const updateLayout = () => {
      const newWidth = Dimensions.get('window').width;
      const columns = printRows(newWidth);
      setWidth(newWidth);
      setNumColumns(columns);
      setCardSize(newWidth / columns);
    };

    const subscription = Dimensions.addEventListener('change', updateLayout);
    return () => subscription?.remove();
  }, []);

  const fetchEnteredOrders = async () => {
    if (!user || !options.url_unansweredOrders) {
      return null;
    }

    try {
      const resp = await axiosInstance.post(options.url_unansweredOrders, {
        type: 1,
        page: 1,
        branchid: branchid,
        Languageid: languageId,
      });
      const data = resp.data.data;
      const feesData = resp.data.fees;
      setOrders(data);
      setFees(feesData);
      setCurrency(resp.data.currency);
      setScheduled(resp.data.scheduled);
    } catch (error) {
      console.log('Error fetching qr entered orders full:', error);
      const statusCode = error?.status || 'Unknown';
      console.log('Status code qr entered orders:', statusCode);
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        console.log(`Retry attempt ${retryCount + 1} of ${MAX_RETRIES}`);

        // Clear current interval
        clearInterval(intervalId);

        // Attempt retry after delay
        setTimeout(() => {
          startInterval();
        }, RETRY_DELAY);
      } else {
        console.log('Max retries reached, stopping interval');
        clearInterval(intervalId);
        handleReload();
      }
    } finally {
      setLoading(false);
    }
  };

  const startInterval = () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    console.log('call interval');
    const newIntervalId = setInterval(() => {
      if (optionsIsLoaded) {
        fetchEnteredOrders();
      } else {
        console.log('Options not loaded');
      }
    }, 5000);

    setIntervalId(newIntervalId);
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
    if (optionsIsLoaded) {
      const subscribe = AppState.addEventListener('change', handleAppStateChange);
      console.log('Starting interval...');
      clearInterval(intervalId);
      startInterval();
      console.log('Interval started.');
      return () => {
        setPreviousOrderCount(0);
        clearInterval(intervalId);
        subscribe.remove();
      };
    }
  }, [optionsIsLoaded, languageId, appState]);

  // ****************************
  // Notifications
  // ****************************
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        if (!optionsIsLoaded) {
          console.log('Options not loaded yet, skipping initialization.');
          return;
        }
        await NotificationManager.initialize(options, type, branchid, languageId, NotificationSoundRef);
      } catch (error) {
        console.error('Error initializing NotificationManager:', error);
      }
    };

    initializeNotifications();
  }, [optionsIsLoaded]);

  useEffect(() => {
    if (!orders || appState !== "active" || !isNotificationReady) return;

    newOrderCount = Object.keys(orders).length;
    if (newOrderCount > previousOrderCount) {
      NotificationSoundRef.current.orderReceived();
    }
    setPreviousOrderCount(newOrderCount);

  }, [orders, appState, isNotificationReady]);

  const renderEnteredOrdersList = ({ item }) => {
    const additionalFees = parseFloat(item.service_fee) / 100;
    const feeData = JSON.parse(item.fees_details || '{}');
    const feesDetails = fees?.reduce((acc, fee) => {
      const feeId = fee['id'];
      if (feeData[feeId]) {
        acc.push(`${fee['value']} : ${parseFloat(feeData[feeId])}`);
      }
      return acc;
    }, []);

    return (
      <Card key={item.id} style={styles.card}>
        <TouchableOpacity onPress={() => toggleContent(item.id)}>
          <Card.Content style={styles.head}>
            <Text variant="headlineMedium" style={styles.header}>
              <MaterialCommunityIcons
                name="music-accidental-sharp"
                style={styles.leftIcon}
              />
              {item.id}
            </Text>
            <Text style={styles.takeAway}>{item.take_away === 1 ? "(" + dictionary["orders.takeAway"] + ")" : ""}</Text>
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

            <Text variant="titleSmall" style={styles.title} numberOfLines={2} ellipsizeMode="tail">
              {dictionary["orders.fName"]}: {item.firstname} {item.lastname}
            </Text>

            <Text variant="titleSmall" style={styles.title}>
              {dictionary["orders.phone"]}: {item.phone_number}
            </Text>


            {item.comment ? (
              <Text variant="titleSmall" style={styles.title} numberOfLines={2} ellipsizeMode="tail">
                {dictionary["orders.comment"]}: {item.comment}
              </Text>
            ) : null}

            <Text variant="titleSmall" style={styles.title} numberOfLines={2} ellipsizeMode="tail">
              {dictionary["orders.paymentMethod"]}: {item.payment_type}
            </Text>

            <Divider />
            <OrdersDetail orderId={item.id} />
            <Divider />

            <Text variant="titleMedium" style={styles.title}> {dictionary["orders.initialPrice"]}: {item.real_price} {currency}</Text>

            <Text variant="titleMedium" style={styles.title}> {dictionary["orders.discountedPrice"]}: {item.price} {currency}</Text>

            <Text variant="titleMedium" style={styles.title}> {dictionary["orders.table"]}: {item.table_number}</Text>

            {feesDetails?.length > 0 && (
              <View>
                <Text variant="titleMedium" style={styles.title}>
                  {dictionary["orders.additionalFees"]}: {additionalFees} {currency}
                </Text>
                <View style={styles.feeDetailsContainer}>
                  {feesDetails.map((fee, index) => (
                    <Text key={index} style={styles.feeDetailText}>
                      {fee} {currency}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            <Text variant="titleMedium" style={styles.title}>
              {dictionary["orders.totalcost"]}: {item.total_cost} {currency}
            </Text>
            <Card.Actions>
              <TouchableOpacity
                style={styles.buttonAccept}
                onPress={() => {
                  setItemId(item.id);
                  setItemTakeAway(item.take_away);
                  showModal("accept");
                }}
              >
                <MaterialCommunityIcons name="check-decagram-outline" size={30} color="white" />
              </TouchableOpacity>


              <TouchableOpacity
                style={styles.buttonReject}
                onPress={() => {
                  setItemId(item.id);
                  setItemTakeAway(null);
                  showModal("reject");
                }}
              >
                <MaterialCommunityIcons name="close-circle-outline" size={30} color="white" />
              </TouchableOpacity>
            </Card.Actions>

          </Card.Content>
        ) : null}
      </Card>
    )
  };

  return (
    <View style={{ flex: 1, width: width }}>
      {loadingOptions ? <Loader /> : null}

      {/* Always render NotificationSound */}
      <NotificationSound ref={NotificationSoundRef} />

      {loading && <Loader show={loading} />}

      {/* Display a fallback message when there are no orders */}
      {(!orders || orders.length === 0) ? (
        null
      ) : (
        <FlatList
          data={[{}]} // Dummy data for the FlatList since we're using ListHeaderComponent for main content
          renderItem={null} // No items in the FlatList itself
          keyExtractor={() => 'dummy'} // Static key for the dummy item
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={{ flexDirection: 'row', flexWrap: 'nowrap', flex: 1 }}>
              {visible && (
                <OrdersModal
                  isVisible={visible}
                  onChangeState={onChangeModalState}
                  orders={orders}
                  hasItemId={itemId}
                  type={modalType}
                  options={options}
                  takeAway={itemTakeAway}
                  PendingOrders={true}
                />
              )}

              <FlatGrid
                adjustGridToStyles={true}
                itemDimension={cardSize}
                spacing={10}
                data={orders}
                renderItem={renderEnteredOrdersList}
                keyExtractor={(item) => (item && item.id ? item.id.toString() : '')}
                itemContainerStyle={{ justifyContent: 'space-between' }}
                style={{ flex: 1 }}
                onEndReachedThreshold={0.5}
              />
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
  },
  card: {
    margin: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    flexWrap: 'nowrap',
    elevation: 8,
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  header: {
    paddingVertical: 10,
  },
  takeAway: {
    paddingVertical: 20,
    fontSize: 15,
  },
  leftIcon: {
    marginRight: 3,
    fontSize: 32,
  },
  rightIcon: {
    marginRight: 15,
    fontSize: 25,
  },
  buttonAccept: {
    width: 85,
    height: 45,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#2fa360",
    backgroundColor: "#2fa360",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  buttonDelay: {
    width: 85,
    height: 45,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#3490dc",
    backgroundColor: "#3490dc",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  buttonReject: {
    width: 85,
    height: 45,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#f14c4c",
    backgroundColor: "#f14c4c",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  title: {
    paddingVertical: 10,
    lineHeight: 24,
    fontSize: 14,
    flexWrap: 'wrap',
  },
  feeDetailsContainer: {
    paddingLeft: 10,
    marginBottom: 15
  },
  feeDetailText: {
    fontSize: 15,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)", // Semi-transparent background
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    width: "80%",
  },
});