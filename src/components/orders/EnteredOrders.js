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
import OrdersDetail from "../OrdersDetail";
import OrdersModal from "../modal/OrdersModal";
import printRows from "../../PrintRows";

import NotificationSound from '../../utils/NotificationSound';
import NotificationManager from '../../utils/NotificationManager';
import OnlineOrdersCard from "../generate/ordersCard/OnlineOrdersCard";


const width = Dimensions.get("window").width;
const numColumns = printRows(width);
const cardSize = width / numColumns;

let newOrderCount;
const type = 0;

// render entered orders function
export const EnteredOrdersList = () => {
  const { domain, branchid, user, intervalId, setIntervalId } = useContext(AuthContext);
  const [isNotificationReady, setIsNotificationReady] = useState(false);
  const NotificationSoundRef = useRef(NotificationSound);
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
    url_rejectOrder: "",
    url_pushToken: ""
  });
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false);
  const [deliveronOptions, setDeliveronOptions] = useState(null);
  const [isDeliveronOptions, setIsDeliveronOptions] = useState(false);
  const [deliveron, setDeliveron] = useState([]);
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
  const MAX_RETRIES = 15;
  const RETRY_DELAY = 5000;

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
        type: 0,
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
      setRetryCount(0);
    } catch (error) {
      console.log('Error fetching entered orders full:', error);
      const statusCode = error?.status || 'Unknown';
      console.log('Status code entered orders:', statusCode);
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
        clearInterval(intervalId);
        setPreviousOrderCount(0);
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
    if (itemTakeAway === null || itemTakeAway === 1) return;
    if (!itemId) {
      setIsDeliveronOptions(false);
      return;
    }

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
                } else {
                  setVisible(false);
                  setLoadingOptions(false);
                  setIsDeliveronOptions(false);
                  setDeliveronOptions(null);
                  setItemId(null);
                }
              },
            },
          ]);

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
    if (!orders || appState !== "active" || !isNotificationReady) return;

    newOrderCount = Object.keys(orders).length;
    if (newOrderCount > previousOrderCount) {
      NotificationSoundRef.current.orderReceived();
    }
    setPreviousOrderCount(newOrderCount);

  }, [orders, appState, isNotificationReady]);

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

    const delayMinutes = parseTimeToMinutes(delay);
    const defaultDelayMinutes = parseTimeToMinutes(scheduled.delay_time);
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

    if (adjustedTimeStamp < currentTimeStamp) {
      alert("The adjusted delivery time is in the past. Please select a valid time.");
      return false;
    }

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
    return <OnlineOrdersCard
      key={item.id}
      item={item}
      dictionary={dictionary}
      currency={currency}
      scheduled={scheduled}
      isOpen={isOpen}
      toggleContent={toggleContent}
    />
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
          data={orders}
          renderItem={null}  // No items in the FlatList itself
          keyExtractor={() => Math.random().toString()}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={(
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
                removeClippedSubviews={true}
              />
            </View>
          )}
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