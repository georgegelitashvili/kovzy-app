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
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';

import { AuthContext, AuthProvider } from "../../context/AuthProvider";
import Loader from "../generate/loader";
import TimePicker from "../generate/TimePicker";
import { String, LanguageContext } from "../Language";
import axiosInstance from "../../apiConfig/apiRequests";
import OrdersDetail from "./OrdersDetail";
import OrdersModal from "../modal/OrdersModal";
import printRows from "../../PrintRows";
import NotificationManager from '../../utils/NotificationManager';

const width = Dimensions.get("window").width;
const numColumns = printRows(width);
const cardSize = width / numColumns;

let ordersCount;
let temp = 0;

// Define a background task name
const TASK_NAME = 'FETCH_NEW_ORDERS';

// render entered orders function
export const EnteredOrdersList = () => {
  const { domain, branchid, setUser, user, intervalId, setIntervalId, shouldRenderAuthScreen, setShouldRenderAuthScreen } = useContext(AuthContext);
  const notificationManagerRef = useRef(null);
  const [orders, setOrders] = useState([]);
  const [fees, setFees] = useState([]);
  const [currency, setCurrency] = useState("");
  const [scheduled, setScheduled] = useState([]);
  const [deliveryScheduled, setDeliveryScheduled] = useState(null);
  const [postponeOrder, setPostponeOrder] = useState(false);

  const [appState, setAppState] = useState(AppState.currentState);

  const [options, setOptions] = useState({
    url_unansweredOrders: "",
    url_deliveronRecheck: "",
    url_acceptOrder: "",
    url_rejectOrder: ""
  }); // api options
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false); // api options
  const [deliveronOptions, setDeliveronOptions] = useState(null);
  const [isDeliveronOptions, setIsDeliveronOptions] = useState(false);

  const [deliveron, setDeliveron] = useState([]);
  const [visible, setVisible] = useState(false); // modal state
  const [itemId, setItemId] = useState(null); //item id for modal
  const [itemTakeAway, setItemTakeAway] = useState(null);
  const [isOpen, setOpenState] = useState([]); // my accordion state
  const [modalType, setModalType] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [isPickerVisible, setPickerVisible] = useState(false);

  const [width, setWidth] = useState(Dimensions.get('window').width);
  const [numColumns, setNumColumns] = useState(printRows(width));
  const [cardSize, setCardSize] = useState(width / numColumns);

  const { dictionary, languageId } = useContext(LanguageContext);

  const onChangeModalState = (newState) => {
    console.log("modal close: ", newState);
    setTimeout(() => {
      setVisible(false);
      setIsDeliveronOptions(false);
      setLoadingOptions(false);
      setLoading(false);
      setItemId(null);
      setDeliveron([]);
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
      url_delayOrders: `https://${domain}/api/v1/admin/postponeOrder`,
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

  // Update layout on dimension change
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
        postponeOrder: false
      });
      const data = resp.data.data;
      const feesData = resp.data.fees;
      setOrders(data);
      setFees(feesData);
      setCurrency(resp.data.currency);
      setScheduled(resp.data.scheduled);
    } catch (error) {
      console.log('Error fetching entered orders full:', error);
      const statusCode = error?.status || 'Unknown';
      console.log('Status code entered orders:', statusCode);
      clearInterval(intervalId);
      handleReload();
    } finally {
      setLoading(false);
    }
  };

  const startInterval = () => {
    console.log('call interval');
    const newIntervalId = setInterval(() => {
      if (optionsIsLoaded) {
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
    if (optionsIsLoaded) {
      const subscribe = AppState.addEventListener('change', handleAppStateChange);
      console.log('Starting interval...');

      // Clear any existing interval
      clearInterval(intervalId);
      // Start the interval
      startInterval();

      console.log('Interval started.');
      return () => {
        clearInterval(intervalId); // Clear the interval in the cleanup function
        subscribe.remove();
      };
    }
  }, [optionsIsLoaded, languageId, appState]);

// handle notifications
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    // Define background task
    const defineTask = async () => {
      TaskManager.defineTask(TASK_NAME, async () => {
        console.log('Background task started');
        try {
          const resp = await axiosInstance.post(options.url_unansweredOrders, {
            type: 1,
            page: 1,
            branchid: branchid,
            Languageid: languageId,
            postponeOrder: false,
          });

          

          console.log('Response received:', resp.data);

          const newOrders = Object.keys(resp.data.data).length;

          if (newOrders > temp) {
            console.log('New orders found, triggering notification...');
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "New Order",
                body: "You have a new order!",
                android: {
                  icon: require("../../../assets/adaptive-icon.png"),
                  color: '#ffffff',
                },
              },
              trigger: null, // Immediate trigger
            });
          }
          temp = newOrders;

          return BackgroundFetch.BackgroundFetchResult.NewData; // Indicate new data available
        } catch (error) {
          console.error('Error in background task:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed; // Indicate failure
        }
      });
    };

    // Function to set up background fetch task
    const setupBackgroundFetch = async () => {
      try {
        console.log('Attempting to register background fetch task...');
        await BackgroundFetch.registerTaskAsync(TASK_NAME, {
          minimumInterval: 30, // Check every 30 seconds
          stopOnTerminate: false, // Keep running even when app is terminated
          startOnBoot: true, // Start after reboot
        });
        console.log('Background fetch task registered successfully.');
      } catch (error) {
        console.error('Failed to register background fetch task:', error);
      }
    };

    // Function to unregister background fetch task
    const unregisterBackgroundFetch = async () => {
      try {
        console.log('Checking if background fetch task is registered...');
        const status = await BackgroundFetch.getStatusAsync();
        console.log('Background fetch status:', status);

        if (status !== BackgroundFetch.Status.Available) {
          console.log(`Task ${TASK_NAME} is not registered, skipping unregistration.`);
          return;
        }

        console.log('Unregistering background fetch task...');
        await BackgroundFetch.unregisterTaskAsync(TASK_NAME);
        console.log('Background fetch task unregistered successfully.');
      } catch (error) {
        console.error('Failed to unregister background fetch task:', error);
      }
    };

    // Define task once at component mount
    defineTask();

    // Register or unregister background fetch task based on appState
    if (appState && appState.match(/inactive|background/)) {
      setupBackgroundFetch();
    } else {
      unregisterBackgroundFetch();
    }

    // Cleanup function to ensure task is unregistered on component unmount
    return () => {
      unregisterBackgroundFetch();
    };

  }, [appState]);


  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();

      if (status !== 'granted') {
        console.log('Permission not granted. Retrying in 10 minutes...');
        // Retry after 10 minutes (10 * 60 * 1000 ms)
        setTimeout(() => {
          requestPermissions(); // Call the function again
        }, 10 * 60 * 1000);
      } else {
        console.log('Notification permissions granted.');
      }
    };

    requestPermissions();
  }, []);

  // set deliveron data
  useEffect(() => {
    // Exit early if `itemTakeAway` is null or 1
    if (itemTakeAway === null || itemTakeAway === 1) return;
    // If `itemId` is null, reset options and exit
    if (!itemId) {
      setIsDeliveronOptions(false);
      return;
    }

    // Update `deliveronOptions` and set flags if necessary
    setDeliveronOptions((prev) => ({
      ...prev,
      data: { orderId: itemId },
    }));
    setIsDeliveronOptions((prev) => prev || true);

  }, [itemId, itemTakeAway]);

  useEffect(() => {
    if (isDeliveronOptions && deliveronOptions.data.orderId) {
      setLoadingOptions(true);
      axiosInstance
        .post(options.url_deliveronRecheck, deliveronOptions.data)
        .then((resp) => resp.data.data)
        .then((data) => {
          const { status, content } = data.original ?? {};
          const alertHandler = (message, shouldClearData = false) => Alert.alert(dictionary["general.alerts"], message, [
            {
              text: dictionary["okay"],
              onPress: () => {
                if (shouldClearData) {
                  setIsDeliveronOptions(false);
                  setLoadingOptions(false);
                  setDeliveronOptions(null);
                  // setDeliveron([]);
                } else {
                  setVisible(false);
                  setLoadingOptions(false);
                  setIsDeliveronOptions(false);
                  setDeliveronOptions(null);
                  setItemId(null);
                  // setDeliveron([]);
                }
              },
            },
          ]);

          // Handle status -1 or -2 and module off case
          if (status === -2 && content === "Module is off") {
            alertHandler(dictionary["dv.deliveronModuleOff"], true);
            setDeliveron(data);
          } else if (status === -1) {
            alertHandler("Order ID not passed or invalid.");
          } else if (Array.isArray(content) && content.length === 0) {
            alertHandler(dictionary["dv.empty"]);
          } else {
            setDeliveron(data);
            setLoadingOptions(false);
          }
        })
        .catch((error) => alertHandler("Error fetching deliveron options."));
    }
  }, [isDeliveronOptions, deliveronOptions]);


  useEffect(() => {
    const checkForNewOrders = async () => {
      if (orders && appState) {
        const ordersCount = Object.keys(orders).length; // Get the count of new orders
        if (ordersCount > temp) {
          // New orders found, trigger notification
          if (notificationManagerRef.current) {
            notificationManagerRef.current.orderReceived();
          }
        }
        temp = ordersCount; // Update temp for the next comparison
      }
    };

    checkForNewOrders(); // Call the async function

  }, [orders, appState]);


  const parseTimeToMinutes = (time) => {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 60 + minutes + seconds / 60;
  };

  const formatDateToLocal = (date) => {
    if (!(date instanceof Date) || isNaN(date)) return "Invalid Date";
    const pad = (num) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  const subtractTime = (baseTime, hours = 0, minutes = 0, seconds = 0) => {
    const time = new Date(baseTime);
    if (isNaN(time)) return "Invalid base time";
    time.setHours(time.getHours() - hours);
    time.setMinutes(time.getMinutes() - minutes);
    time.setSeconds(time.getSeconds() - seconds);
    return time;
  };

  const handleDelaySet = (delay) => {
    setLoadingOptions(false);
    if (!deliveryScheduled) {
      alert("Delivery scheduled time is not set. Please provide a valid time.");
      return false;
    }

    const deliveryScheduledTime = new Date(deliveryScheduled.replace(' ', 'T'));
    if (isNaN(deliveryScheduledTime)) {
      alert("Invalid delivery scheduled time format.");
      return false;
    }

    // Check if the provided delay is less than the default delay time
    const delayMinutes = parseTimeToMinutes(delay);
    const defaultDelayMinutes = parseTimeToMinutes(scheduled.delay_time);

    // Use default delay time if provided delay is less than the default delay
    const effectiveDelay = delayMinutes < defaultDelayMinutes ? scheduled.delay_time : delay;
    console.log("Effective Delay:", effectiveDelay);

    const [delayHours, delayMinutesUsed, delaySeconds] = effectiveDelay.split(':').map(Number);
    const adjustedTime = subtractTime(deliveryScheduledTime, delayHours, delayMinutesUsed, delaySeconds);

    if (isNaN(adjustedTime)) {
      console.error("Invalid adjusted time:", adjustedTime);
      return false;
    }

    const adjustedTimeStamp = adjustedTime.getTime();
    const deliveryScheduledStamp = deliveryScheduledTime.getTime();
    const currentTimeStamp = new Date().getTime();

    // Check if adjusted time is earlier than the current time
    if (adjustedTimeStamp < currentTimeStamp) {
      alert("The adjusted delivery time is in the past. Please select a valid time.");
      return false;
    }

    // Check if the adjusted time is after or equal to the scheduled delivery time
    if (adjustedTimeStamp >= deliveryScheduledStamp) {
      alert("The adjusted delivery time is later than the scheduled time. The order cannot be delayed.");
      return false;
    }

    try {
      setPostponeOrder(true);
      axiosInstance
        .post(options.url_delayOrders, {
          Orderid: itemId,
          orderDelayTime: formatDateToLocal(adjustedTime)
        })
        .then((resp) => {
          return resp.data.data
        })
        .then((data) => {
          setPostponeOrder(false);
          if (data.status === 0) {
            Alert.alert(
              dictionary["general.alerts"],
              `Order delay till: ${formatDateToLocal(adjustedTime)}`,
              [
                {
                  text: dictionary["okay"],
                  onPress: () => setPickerVisible(false),
                },
              ]
            );

          }
          setLoading(false);
        });
    } catch (error) {
      console.error("Error delaying order:", error);
      Alert.alert("Error", "There was a problem delaying the order. Please try again.");
    }
  };


  const renderEnteredOrdersList = ({ item }) => {
    const deliveryPrice = parseFloat(item.delivery_price);
    const additionalFees = parseFloat(item.service_fee) / 100;
    const feeData = JSON.parse(item.fees_details || '{}');
    const feesDetails = fees?.reduce((acc, fee) => {
      const feeId = fee['id'];
      if (feeData[feeId]) {
        acc.push(`${fee['value']} : ${parseFloat(feeData[feeId])}`);
      }
      return acc;
    }, []);

    const isScheduled = item.take_away ? scheduled.scheduled_takeaway : scheduled.scheduled_delivery;

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
            <Text style={styles.takeAway}>{item.take_away === 1 ? "("+dictionary["orders.takeAway"] + ")" : ""}</Text>
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

            <Text variant="titleSmall" style={styles.title} ellipsizeMode="tail">
              {dictionary["orders.address"]}: {item.address}
            </Text>

            {item.delivery_scheduled ? (
              <Text variant="titleSmall" style={styles.title} numberOfLines={2} ellipsizeMode="tail">
                {dictionary["orders.scheduledDeliveryTime"]}: {item.delivery_scheduled}
              </Text>
            ) : null}

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

            <Text variant="titleMedium" style={styles.title}> {dictionary["orders.deliveryPrice"]}: {deliveryPrice} {currency}</Text>

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

              {item.delivery_scheduled !== null && isScheduled && (
                <TouchableOpacity
                  style={styles.buttonDelay}
                  onPress={() => {
                    setItemId(item.id);
                    setDeliveryScheduled(item.delivery_scheduled);
                    setPickerVisible(true);
                    setLoadingOptions(false);
                  }}
                >
                  <MaterialCommunityIcons name="bell-ring-outline" size={30} color="white" />
                </TouchableOpacity>
              )}

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


  if (loading) {
    return <Loader show={loading} />;
  }

  if (!orders || orders.length === 0) {
    return null;
  }

  return (
    <View style={{ flex: 1, width: width }}>
      {loadingOptions ? <Loader /> : null}
      <NotificationManager ref={notificationManagerRef} />

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
                deliveron={deliveron ?? null}
                deliveronOptions={deliveronOptions}
                type={modalType}
                options={options}
                takeAway={itemTakeAway}
                PendingOrders={true}
              />
            )}

            <Modal
              transparent={true}
              visible={isPickerVisible}
              animationType="fade"
              onRequestClose={() => { setPickerVisible(false); setLoadingOptions(false); }}
            >
              <View style={styles.modalContainer}>
                <TimePicker
                  scheduled={scheduled}
                  showButton={true}
                  onDelaySet={handleDelaySet}
                  onClose={() => { setPickerVisible(false); setLoadingOptions(false); }} // Close when done
                />
              </View>
            </Modal>

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