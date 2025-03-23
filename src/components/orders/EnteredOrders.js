import React, { useState, useEffect, useCallback, useContext, useRef, useReducer } from "react";
import {
  StyleSheet,
  Dimensions,
  View,
  Modal,
  TouchableOpacity,
  Alert,
  AppState,
  FlatList,
  VirtualizedList
} from "react-native";

import { Text, Button, Divider, Card } from "react-native-paper";
import { FlatGrid } from "react-native-super-grid";
import { MaterialCommunityIcons, SimpleLineIcons } from "@expo/vector-icons";
import * as Updates from 'expo-updates';
import { Audio } from 'expo-av';

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
import { orderReducer, initialState } from '../../reducers/orderReducer';
import OrderCard from "./OrderCard";
import { handleDelaySet } from '../../utils/timeUtils';
import { debounce } from 'lodash';

const width = Dimensions.get("window").width;
const numColumns = printRows(width);
const cardSize = width / 2 - 15;

let newOrderCount;
const type = 0;

export const EnteredOrdersList = () => {
  const { domain, branchid, user } = useContext(AuthContext);
  const { dictionary, languageId } = useContext(LanguageContext);
  const [state, dispatch] = useReducer(orderReducer, initialState);
  const NotificationSoundRef = useRef(null);
  const soundRef = useRef(null);
  const intervalRef = useRef(null);
  const [width, setWidth] = useState(Dimensions.get('window').width);
  const [numColumns, setNumColumns] = useState(printRows(width));
  const [cardSize, setCardSize] = useState(width / 2 - 15);
  const [retryCount, setRetryCount] = useState(0);
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [options, setOptions] = useState({
    url_unansweredOrders: "",
    url_deliveronRecheck: "",
    url_acceptOrder: "",
    url_rejectOrder: "",
    url_pushToken: ""
  });
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false);
  const processedOrdersRef = useRef(new Set());
  const [itemId, setItemId] = useState(null);
  const [cachedOrders, setCachedOrders] = useState(new Map());

  const MAX_RETRIES = 15;
  const RETRY_DELAY = 5000;
  const FETCH_INTERVAL = 3000;
  const DEBOUNCE_DELAY = 300;

  useEffect(() => {
    // Initialize notification sound
    NotificationSoundRef.current = {
      orderReceived: async () => {
        try {
          if (soundRef.current) {
            await soundRef.current.unloadAsync();
          }
          
          const { sound } = await Audio.Sound.createAsync(
            require('../../assets/audio/order.mp3')
          );
          soundRef.current = sound;
          await sound.playAsync();
        } catch (error) {
          console.warn('Error playing notification sound:', error);
        }
      }
    };

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (NotificationSoundRef.current) {
        NotificationSoundRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const updateLayout = () => {
      const newWidth = Dimensions.get('window').width;
      const columns = printRows(newWidth);
      setWidth(newWidth);
      setNumColumns(columns);
      setCardSize(newWidth / 2 - 15);
    };

    const subscription = Dimensions.addEventListener('change', updateLayout);
    return () => subscription?.remove();
  }, []);

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

  const fetchEnteredOrders = async () => {
    if (!user || !options.url_unansweredOrders) return null;

    try {
      const resp = await axiosInstance.post(options.url_unansweredOrders, {
        type: 0,
        page: 1,
        branchid: branchid,
        Languageid: languageId,
        postponeOrder: false
      });

      const newOrders = resp.data.data;
      const currentOrderIds = new Set(newOrders.map(order => order.id));
      const hasNewOrders = newOrders.some(order => !processedOrdersRef.current.has(order.id));

      if (hasNewOrders) {
        // პირველად გამოვიტანოთ ალერტი
        Alert.alert(
          dictionary["general.alerts"],
          dictionary["orders.newOrder"],
          [{ text: dictionary["okay"] }]
        );

        // შემდეგ დავუკრათ ხმა
        if (NotificationSoundRef?.current) {
          try {
            await NotificationSoundRef.current.orderReceived();
          } catch (error) {
            console.warn('Error playing notification sound:', error);
          }
        }
        
        // ბოლოს განვაახლოთ დამუშავებული შეკვეთების სია
        currentOrderIds.forEach(id => processedOrdersRef.current.add(id));
      }

      dispatch({
        type: 'SET_ORDERS',
        payload: {
          orders: newOrders,
          fees: resp.data.fees,
          currency: resp.data.currency,
          scheduled: resp.data.scheduled
        }
      });

      setRetryCount(0);
    } catch (error) {
      console.log('Error fetching entered orders:', error);
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        setTimeout(startInterval, RETRY_DELAY);
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        handleReload();
      }
    }
  };

  const debouncedFetch = useCallback(
    debounce(() => {
      if (optionsIsLoaded) {
        fetchEnteredOrders();
      }
    }, DEBOUNCE_DELAY),
    [optionsIsLoaded]
  );

  const startInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(debouncedFetch, FETCH_INTERVAL);
  }, [optionsIsLoaded]);

  const handleAppStateChange = useCallback((nextAppState) => {
    if (appState.match(/inactive|background/) && nextAppState === "active") {
      startInterval();
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    setAppState(nextAppState);
  }, [appState]);

  useEffect(() => {
    if (domain && branchid) {
      apiOptions();
    } else if (domain || branchid) {
      setOptionsIsLoaded(false);
      dispatch({ type: 'SET_ORDERS', payload: { orders: [], fees: [], currency: "", scheduled: [] }});
    }
  }, [domain, branchid, apiOptions]);

  useEffect(() => {
    if (optionsIsLoaded) {
      const subscribe = AppState.addEventListener('change', handleAppStateChange);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      startInterval();
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        dispatch({ type: 'UPDATE_ORDER_COUNT', payload: 0 });
        subscribe.remove();
      };
    }
  }, [optionsIsLoaded, languageId, appState]);

  useEffect(() => {
    const initializeNotifications = async () => {
      if (!optionsIsLoaded) return;
      try {
        await NotificationManager.initialize(options, type, branchid, languageId, NotificationSoundRef);
      } catch (error) {
        console.error('Error initializing NotificationManager:', error);
      }
    };

    initializeNotifications();
  }, [optionsIsLoaded]);

  const handleReload = async () => {
    await Updates.reloadAsync();
  };

  const handleToggleContent = useCallback((id) => {
    dispatch({ type: 'TOGGLE_CONTENT', payload: id });
  }, []);

  const handleAcceptOrder = useCallback((id, takeAway) => {
    dispatch({
      type: 'SET_MODAL_STATE',
      payload: {
        visible: true,
        modalType: 'accept',
        itemId: id,
        itemTakeAway: takeAway
      }
    });
  }, []);

  const handleRejectOrder = useCallback((id) => {
    dispatch({
      type: 'SET_MODAL_STATE',
      payload: {
        visible: true,
        modalType: 'reject',
        itemId: id,
        itemTakeAway: null
      }
    });
  }, []);

  const handleDelayOrder = useCallback((id, scheduledTime) => {
    dispatch({ type: 'SET_MODAL_STATE', payload: { itemId: id } });
    dispatch({ type: 'SET_DELIVERY_SCHEDULED', payload: scheduledTime });
    setPickerVisible(true);
    dispatch({ type: 'SET_LOADING_OPTIONS', payload: false });
  }, []);

  const handleModalClose = useCallback(() => {
    dispatch({ type: 'RESET_MODAL_STATE' });
  }, []);

  const handleDelaySetWrapper = useCallback(async (delay) => {
    const params = {
      delay,
      deliveryScheduled: state.deliveryScheduled,
      scheduled: state.scheduled,
      itemId: state.itemId,
      options,
      setLoadingOptions: (value) => dispatch({ type: 'SET_LOADING_OPTIONS', payload: value }),
      setPostponeOrder: (value) => dispatch({ type: 'SET_POSTPONE_ORDER', payload: value }),
      setPickerVisible,
      setLoading: (value) => dispatch({ type: 'SET_LOADING', payload: value })
    };

    await handleDelaySet(params);
  }, [state.deliveryScheduled, state.scheduled, state.itemId, options, dictionary]);

  const renderOrderCard = useCallback(({ item }) => (
    <OrderCard
      key={item.id}
      item={item}
      currency={state.currency}
      isOpen={state.isOpen.includes(item.id)}
      fees={state.fees}
      scheduled={state.scheduled}
      dictionary={dictionary}
      onToggle={handleToggleContent}
      onAccept={handleAcceptOrder}
      onDelay={handleDelayOrder}
      onReject={handleRejectOrder}
    />
  ), [state.currency, state.isOpen, state.fees, state.scheduled, dictionary, handleToggleContent, handleAcceptOrder, handleDelayOrder, handleRejectOrder]);

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  const getItemLayout = useCallback((data, index) => ({
    length: cardSize,
    offset: cardSize * index,
    index,
  }), [cardSize]);

  const getItem = (data, index) => data[index];
  const getItemCount = (data) => data.length;

  // Reset processed orders when component unmounts or app goes to background
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'background') {
        processedOrdersRef.current.clear();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
      processedOrdersRef.current.clear();
    };
  }, []);

  return (
    <View style={{ flex: 1, width: width }}>
      {state.loadingOptions && <Loader />}
      <NotificationSound ref={NotificationSoundRef} />
      {state.loading && <Loader show={state.loading} />}

      {(!state.orders || state.orders.length === 0) ? null : (
        <FlatGrid
          adjustGridToStyles={true}
          itemDimension={cardSize}
          spacing={10}
          data={state.orders}
          renderItem={renderOrderCard}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          fixed={true}
          staticDimension={width}
          horizontal={false}
          numColumns={2}
          itemContainerStyle={{ 
            width: cardSize,
            margin: 5,
          }}
          style={{ flex: 1 }}
          ListHeaderComponent={
            <View>
              {state.visible && (
                <OrdersModal
                  isVisible={state.visible}
                  onChangeState={handleModalClose}
                  orders={state.orders}
                  hasItemId={state.itemId}
                  deliveron={state.deliveron}
                  deliveronOptions={state.deliveronOptions}
                  type={state.modalType}
                  options={options}
                  takeAway={state.itemTakeAway}
                  PendingOrders={true}
                />
              )}

              <Modal
                transparent={true}
                visible={isPickerVisible}
                animationType="fade"
                onRequestClose={() => {
                  setPickerVisible(false);
                  dispatch({ type: 'SET_LOADING_OPTIONS', payload: false });
                }}
              >
                <View style={styles.modalContainer}>
                  <TimePicker
                    scheduled={state.scheduled}
                    showButton={true}
                    onDelaySet={handleDelaySetWrapper}
                    onClose={() => {
                      setPickerVisible(false);
                      dispatch({ type: 'SET_LOADING_OPTIONS', payload: false });
                    }}
                  />
                </View>
              </Modal>
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
    flex: 1,
    margin: 5,
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
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    width: "80%",
  },
});