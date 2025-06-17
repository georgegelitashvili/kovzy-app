import React, { useState, useEffect, useCallback, useContext, useRef, useReducer, useMemo } from "react";
import {
  StyleSheet,
  Dimensions,
  View,
  Modal,
  TouchableOpacity,
  Alert,
  AppState,
  FlatList,
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

const calculateColumns = (width) => {
  const minCardWidth = 300; // Minimum width you want for each card
  const maxColumns = Math.floor(width / minCardWidth);
  return Math.max(1, maxColumns); // Ensure at least 1 column
};

const calculateCardSize = (width, columns) => {
  const marginBetweenCards = 10;
  const totalMargin = marginBetweenCards * (columns + 1);
  return (width - totalMargin) / columns;
};
let newOrderCount;
const type = 0;

export const EnteredOrdersList = () => {
  const { domain, branchid, user } = useContext(AuthContext);
  const { dictionary, languageId } = useContext(LanguageContext);
  const [state, dispatch] = useReducer(orderReducer, initialState);
  const NotificationSoundRef = useRef(null);
  const soundRef = useRef(null);
  const intervalRef = useRef(null);
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
  const lastOrdersRef = useRef(new Set());
  const isInitialFetchRef = useRef(true);
  const [layoutKey, setLayoutKey] = useState(0);

  // Corrected layout refs
  const width = useRef(Dimensions.get('window').width);
  const numColumns = useRef(calculateColumns(width.current));
  const cardSize = useRef(calculateCardSize(width.current, numColumns.current));

  const MAX_RETRIES = 15;
  const RETRY_DELAY = 5000;
  const FETCH_INTERVAL = 3000;
  const DEBOUNCE_DELAY = 300;

  const updateLayout = useCallback(() => {
    const newWidth = Dimensions.get('window').width;
    const newColumns = calculateColumns(newWidth);
    const newCardSize = calculateCardSize(newWidth, newColumns);

    // Only update if layout actually changed
    if (newColumns !== numColumns.current || newWidth !== width.current) {
      width.current = newWidth;
      numColumns.current = newColumns;
      cardSize.current = newCardSize;
      setLayoutKey(prev => prev + 1);
    }
  }, []);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', updateLayout);
    updateLayout(); // Initial calculation
    return () => subscription?.remove();
  }, [updateLayout]);

  // Initialize notification sound
  useEffect(() => {
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

  const fetchEnteredOrders = useCallback(async () => {
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

      const newOrders = resp.data.data;
      
      if (isInitialFetchRef.current) {
        console.log('Initial fetch completed');
        isInitialFetchRef.current = false;
        if (newOrders.length > 0) {
          Alert.alert(
            dictionary["general.alerts"],
            dictionary["orders.newOrder"],
            [{ text: dictionary["okay"] }]
          );
          
          if (NotificationSoundRef?.current) {
            try {
              await NotificationSoundRef.current.orderReceived();
            } catch (error) {
              console.warn('Error playing notification sound:', error);
            }
          }
        }
        newOrders.forEach(order => lastOrdersRef.current.add(order.id));
      } else {
        const hasNewOrders = newOrders.some(order => !lastOrdersRef.current.has(order.id));
        
        if (hasNewOrders) {
          Alert.alert(
            dictionary["general.alerts"],
            dictionary["orders.newOrder"],
            [{ text: dictionary["okay"] }]
          );

          if (NotificationSoundRef?.current) {
            try {
              await NotificationSoundRef.current.orderReceived();
            } catch (error) {
              console.warn('Error playing notification sound:', error);
            }
          }
          
          newOrders.forEach(order => lastOrdersRef.current.add(order.id));
        }
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
      
      console.log('State updated successfully');
      dispatch({ type: 'SET_LOADING', payload: false });

      setRetryCount(0);
    } catch (error) {
      console.log('Error in fetchEnteredOrders:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying... Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
        setRetryCount(prev => prev + 1);
        if (intervalRef.current) {
        clearInterval(intervalRef.current);
        }
        setTimeout(startInterval, RETRY_DELAY);
      } else {
        console.log('Max retries reached, reloading app');
        if (intervalRef.current) {
        clearInterval(intervalRef.current);
        }
        handleReload();
      }
    }
  }, [user, options.url_unansweredOrders, branchid, languageId, dictionary, retryCount]);

  const debouncedFetch = useCallback(
    debounce(() => {
      if (optionsIsLoaded && user && options.url_unansweredOrders) {
        fetchEnteredOrders();
      }
    }, DEBOUNCE_DELAY),
    [optionsIsLoaded, user, options.url_unansweredOrders, fetchEnteredOrders]
  );

  const startInterval = useCallback(() => {
    if (intervalRef.current) {
    clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(debouncedFetch, FETCH_INTERVAL);
  }, [optionsIsLoaded]);

  const handleAppStateChange = useCallback((nextAppState) => {
    if (appState.match(/inactive|background/) && nextAppState === "active") {
      isInitialFetchRef.current = true;
      lastOrdersRef.current.clear();
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

  const handleAcceptOrder = useCallback(async (itemId, itemTakeAway) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      if (itemTakeAway === 1) {
        dispatch({
          type: 'SET_MODAL_STATE',
          payload: {
            visible: true,
            modalType: 'accept',
            itemId: itemId,
            itemTakeAway: itemTakeAway
          }
        });
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      const response = await axiosInstance.post(options.url_deliveronRecheck, {
        orderId: itemId,
      });

      if (response.data?.data?.original?.content.length !== 0) {
        dispatch({
          type: 'SET_DELIVERON_DATA',
          payload: response.data.data
        });
        dispatch({
          type: 'SET_MODAL_STATE',
          payload: {
            visible: true,
            modalType: 'accept',
            itemId: itemId,
            itemTakeAway: itemTakeAway
          }
        });
      } else if (response.data?.data?.original?.content.length === 0) {
        dispatch({
          type: 'SET_DELIVERON_DATA',
          payload: []
        });
        Alert.alert("ALERT", dictionary["dv.empty"], [
          {
            text: "okay", onPress: () => {
              dispatch({
                type: 'SET_DELIVERON_DATA',
                payload: []
              });
            }
          },
        ]);
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.log('Error in handleAcceptOrder:', error);
      dispatch({
        type: 'SET_DELIVERON_DATA',
        payload: []
      });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [options.url_deliveronRecheck]);

  const handleRejectOrder = useCallback((id) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    dispatch({
      type: 'SET_MODAL_STATE',
      payload: {
        visible: true,
        modalType: 'reject',
        itemId: id,
        itemTakeAway: null
      }
    });
    
    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  const handleDelayOrder = useCallback((id, scheduledTime) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    dispatch({ type: 'SET_MODAL_STATE', payload: { itemId: id } });
    dispatch({ type: 'SET_DELIVERY_SCHEDULED', payload: scheduledTime });
    setPickerVisible(true);
    
    dispatch({ type: 'SET_LOADING', payload: false });
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
    <View style={{
      width: cardSize.current,
      margin: 5,
      minWidth: 300,
      maxWidth: 400
    }}>
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
        loading={state.loading}
      />
    </View>
  ), [state.currency, state.isOpen, state.fees, state.scheduled, state.loading, dictionary, handleToggleContent, handleAcceptOrder, handleDelayOrder, handleRejectOrder]);

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  const listKey = useMemo(() => `list-${layoutKey}-${numColumns.current}`, [layoutKey]);

  return (
    <View style={styles.container}>
      {state.loadingOptions && <Loader />}
      <NotificationSound ref={NotificationSoundRef} />
      {state.loading && <Loader show={state.loading} />}

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

      <FlatList
        key={listKey}
        numColumns={numColumns.current}
        data={state.orders}
        renderItem={renderOrderCard}
        keyExtractor={keyExtractor}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={21}
        initialNumToRender={10}
        onEndReachedThreshold={0.5}
        contentContainerStyle={[
          styles.listContainer,
          { paddingHorizontal: 5 }
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text>{dictionary["orders.noOrders"]}</Text>
          </View>
        }
        refreshing={state.loading}
        onRefresh={debouncedFetch}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 5,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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