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
import { String, LanguageContext } from "../Language";
import axiosInstance from "../../apiConfig/apiRequests";
import OrdersDetail from "../OrdersDetail";
import OrdersModal from "../modal/OrdersModalQr";
import printRows from "../../PrintRows";

import NotificationSound from '../../utils/NotificationSound';
import NotificationManager from '../../utils/NotificationManager';
import { useOrderDetails } from "../../hooks/useOrderDetails";
import eventEmitter from "../../utils/EventEmitter";
import { getShowCancelButtonSetting } from "../../helpers/settings";

const initialWidth = Dimensions.get("window").width;
const getColumnsByScreenSize = (screenWidth) => {
  if (screenWidth < 600) return 1; // Mobile phones
  if (screenWidth < 960) return 2; // Tablets
  return 3; // Larger screens
};

const initialColumns = getColumnsByScreenSize(initialWidth);
const getCardSize = (width, columns) => width / columns - (columns > 1 ? 15 : 30);
let newOrderCount;
const type = 1;

// render entered orders function
export const EnteredOrdersList = () => {
  const { domain, branchid, user } = useContext(AuthContext);
  const [isNotificationReady, setIsNotificationReady] = useState(false);
  // Use the custom hook for order details management
  const {
    orderDetails,
    loadingDetails,
    fetchBatchOrderDetails,
    fetchOrderDetailsLazy,
    isOrderDetailsLoaded,
    clearOrderDetails,
    getOrderDetails
  } = useOrderDetails();
  const NotificationSoundRef = useRef(NotificationSound);
  const intervalRef = useRef(null);
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
  const [numColumns, setNumColumns] = useState(getColumnsByScreenSize(width));
  const [cardSize, setCardSize] = useState(getCardSize(width, numColumns));
  const [previousOrderCount, setPreviousOrderCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [showCancelButton, setShowCancelButton] = useState(false);

  const prevLanguageIdRef = useRef(languageId);
  const isLanguageChangeInProgressRef = useRef(false);
  const isComponentMountedRef = useRef(false);

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

  const toggleContent = useCallback((value) => {
    setOpenState(prev => {
      if (prev.includes(value)) {
        // Currently collapsed - expand it by removing from the closed list
        return prev.filter((i) => i !== value);
      } else {
        // Currently expanded - collapse it by adding to the closed list
        // Lazy load: fetch order details when expanding if not already loaded
        if (!orderDetails[value]) {
          fetchOrderDetailsLazy(value);
        }
        return [...prev, value];
      }
    });
  }, [orderDetails, fetchOrderDetailsLazy]);

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
      const columns = getColumnsByScreenSize(newWidth);
      setWidth(newWidth);
      setNumColumns(columns);
      setCardSize(getCardSize(newWidth, columns));
    };

    const subscription = Dimensions.addEventListener('change', updateLayout);
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    const loadCancelButtonSetting = async () => {
      const setting = await getShowCancelButtonSetting();
      setShowCancelButton(setting);
    };
    loadCancelButtonSetting();

    // Listen for storage changes
    const handleSettingChange = (event) => {
      if (event && typeof event.showCancelButton === 'boolean') {
        setShowCancelButton(event.showCancelButton);
      }
    };

    const listener = eventEmitter.addEventListener('cancelButtonSettingChanged', handleSettingChange);

    return () => {
      eventEmitter.removeEventListener(listener);
    };
  }, []);

  const initializeNotifications = async () => {
    try {
      await NotificationManager.initialize(options, branchid, NotificationSoundRef);
    } catch (error) {
      console.error('Error initializing NotificationManager:', error);
    }
  };

  const fetchEnteredOrders = async (showLoader = false) => {
    if (!user || !options.url_unansweredOrders) {
      return null;
    }

    // Only show loading when explicitly requested (initial load)
    if (showLoader) {
      setLoading(true);
    }

    try {
      console.log(`📋 Fetching QR orders with languageId: ${languageId}`);
      const resp = await axiosInstance.post(options.url_unansweredOrders, {
        type: 1,
        page: 1,
        branchid: branchid,
        Languageid: languageId,
      });
      const data = resp.data.data;
      const feesData = resp.data.fees;
      
      // Get current order IDs to compare with new ones
      const currentOrderIds = orders.map(order => order.id);
      const newOrderIds = data.map(order => order.id);
      
      // Find orders that are new to the orders state AND don't have cached details
      const ordersNeedingDetails = newOrderIds.filter(id => 
        !currentOrderIds.includes(id) && !isOrderDetailsLoaded(id)
      );
      
      // Update orders, fees, and currency first
      setOrders(data);
      setFees(feesData);
      setCurrency(resp.data.currency);

      // Handle order details fetching
      if (isLanguageChangeInProgressRef.current) {
        // During language change, force fetch all order details
        if (newOrderIds.length > 0) {
          console.log(`Language change: force fetching details for ${newOrderIds.length} QR orders with languageId: ${languageId}`);
          await fetchBatchOrderDetails(newOrderIds, true);
        }
      } else {
        // Normal flow - only fetch details for new orders
        if (ordersNeedingDetails.length > 0) {
          console.log(`Fetching details for ${ordersNeedingDetails.length} new QR orders:`, ordersNeedingDetails);
          await fetchBatchOrderDetails(ordersNeedingDetails, showLoader);
        }
        // Special case: if this is the very first load, fetch only uncached orders
        else if (currentOrderIds.length === 0 && newOrderIds.length > 0) {
          const uncachedOrders = newOrderIds.filter(id => !isOrderDetailsLoaded(id));
          if (uncachedOrders.length > 0) {
            console.log(`Initial QR load: fetching details for ${uncachedOrders.length} uncached orders`);
            await fetchBatchOrderDetails(uncachedOrders, showLoader);
          }
        }
      }
      
      // Reset retry count on successful fetch
      setRetryCount(0);
      
    } catch (error) {
      console.log('Error fetching qr entered orders full:', error);
      const statusCode = error?.status || 'Unknown';
      console.log('Status code qr entered orders:', statusCode);
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        console.log(`Retry attempt ${retryCount + 1} of ${MAX_RETRIES}`);

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }

        setTimeout(() => {
          startInterval();
        }, RETRY_DELAY);
      } else {
        console.log('Max retries reached, stopping interval');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        handleReload();
      }
    } finally {
      // Only hide loading if it was shown
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const startInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    console.log('call interval');
    
    // Initial fetch with loader
    if (optionsIsLoaded) {
      fetchEnteredOrders(true); // Show loader for first call
    }
    
    intervalRef.current = setInterval(() => {
      if (optionsIsLoaded) {
        fetchEnteredOrders(false); // No loader for interval calls
      } else {
        console.log('Options not loaded');
      }
    }, 5000);
  };

  const handleAppStateChange = (nextAppState) => {
    if (appState.match(/inactive|background/) && nextAppState === "active") {
      console.log('QR App state changed: background -> active');
      // Don't interfere if language change is in progress
      if (!isLanguageChangeInProgressRef.current) {
        startInterval();
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    setAppState(nextAppState);
  };

  useEffect(() => {
    if (domain && branchid) {
      apiOptions();
    } else if (domain || branchid) {
      setOptionsIsLoaded(false);
      setOrders([]);
      // Clear order details cache when switching domains/branches
      clearOrderDetails();
    }
  }, [domain, branchid, apiOptions, clearOrderDetails]);

  useEffect(() => {
    // Skip first run (component mount)
    if (!isComponentMountedRef.current) {
      isComponentMountedRef.current = true;
      if (optionsIsLoaded) {
        const subscribe = AppState.addEventListener('change', handleAppStateChange);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        startInterval();
        console.log('Interval started.');
        return () => {
          setPreviousOrderCount(0);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          subscribe.remove();
        };
      }
      return;
    }
    
    // Handle language change
    const previousLangId = prevLanguageIdRef.current;
    const hasLanguageChanged = previousLangId !== languageId;
    
    if (optionsIsLoaded && hasLanguageChanged) {
      console.log(`🔄 Language changed from ${previousLangId} to ${languageId}, forcing complete refresh`);
      
      // Set language change flag to prevent double intervals
      isLanguageChangeInProgressRef.current = true;
      prevLanguageIdRef.current = languageId;
      
      // Stop current interval to prevent conflicts
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Force fetch with new language ID
      (async () => {
        try {
          console.log(`🌍 Fetching QR orders with new languageId: ${languageId}`);
          
          // Fetch orders with new language
          await fetchEnteredOrders(true);
          
          // Clear language change flag
          isLanguageChangeInProgressRef.current = false;
          
          // Restart interval
          startInterval();
          
          console.log(`✅ QR Language change complete - orders and details refreshed with languageId: ${languageId}`);
        } catch (error) {
          console.log('Error in QR language change fetch:', error);
          // Clear language change flag even on error
          isLanguageChangeInProgressRef.current = false;
          // Restart interval even on error
          startInterval();
        }
      })();
    } else if (optionsIsLoaded && !isLanguageChangeInProgressRef.current) {
      // Normal flow - no language change
      const subscribe = AppState.addEventListener('change', handleAppStateChange);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      startInterval();
      console.log('Interval started.');
      return () => {
        setPreviousOrderCount(0);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        subscribe.remove();
      };
    }
  }, [optionsIsLoaded, languageId, appState]);

  // ****************************
  // Notifications
  // ****************************
  useEffect(() => {
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
      <View style={{
        width: width / numColumns - (numColumns > 1 ? 15 : 30),
        marginHorizontal: 5
      }}>
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
              <Text variant="headlineMedium" style={styles.header}>              <SimpleLineIcons
                  name={isOpen.includes(item.id) ? "arrow-down" : "arrow-up"}
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
                <Text variant="titleSmall" style={styles.title}>
                  {dictionary["orders.comment"]}: {item.comment}
                </Text>
              ) : null}

              <Text variant="titleSmall" style={styles.title} numberOfLines={2} ellipsizeMode="tail">
                {dictionary["orders.paymentMethod"]}: {item.payment_type}
              </Text>

              <Divider />
              <OrdersDetail orderId={item.id} orderData={getOrderDetails(item.id)} />
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
                {showCancelButton && (
                  <TouchableOpacity
                    style={styles.buttonReject}
                    onPress={() => {
                      setItemId(item.id);
                      setItemTakeAway(null);
                      showModal('reject');
                    }}
                  >
                    <MaterialCommunityIcons
                      name="close-circle-outline"
                      size={30}
                      color="white"
                    />
                  </TouchableOpacity>
                )}
              </Card.Actions>

            </Card.Content>
          ) : null}
        </Card>
      </View>
    )
  };

  const getItemLayout = useCallback((data, index) => ({
    length: cardSize,
    offset: cardSize * index,
    index,
  }), [cardSize]);

  return (
    <View style={{ flex: 1, width: width }}>
      {loadingOptions ? <Loader /> : null}

      {/* Always render NotificationSound */}
      <NotificationSound ref={NotificationSoundRef} />

      {/* Show loader while loading orders or order details on initial load */}
      {(loading || loadingDetails) ? (
        <Loader show={loading || loadingDetails} />
      ) : (
        /* Display orders when loaded */
        (!orders || orders.length === 0) ? (
          null
        ) : (
          <FlatList
            data={[{}]} // Dummy data for the FlatList since we're using ListHeaderComponent for main content
            renderItem={null} // No items in the FlatList itself
            keyExtractor={() => 'dummy-header-content'} // Fixed key for the single dummy item
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
                <FlatList
                  key={`flat-list-${numColumns}`}
                  numColumns={numColumns}
                  spacing={10}
                  data={orders}
                  renderItem={renderEnteredOrdersList}
                  keyExtractor={(item) => (item && item.id ? item.id.toString() : '')}
                  style={{ flex: 1 }}
                  onEndReachedThreshold={0.5}
                  removeClippedSubviews={true}
                  getItemLayout={getItemLayout}
                />
              </View>
            }
          />
        )
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
    paddingVertical: 8,
    lineHeight: 20,
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