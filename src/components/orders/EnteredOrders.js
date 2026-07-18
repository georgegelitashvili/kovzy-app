import React, { useState, useEffect, useCallback, useContext, useRef, useReducer, useMemo } from "react";
import {
  StyleSheet,
  Dimensions,
  View,
  Alert,
  AppState,
  FlatList,
} from "react-native";

import { Text } from "react-native-paper";
import { FlatGrid } from "react-native-super-grid";
import * as Updates from 'expo-updates';
import { Audio } from 'expo-av';
import NetInfo from '@react-native-community/netinfo';

import { useAuthState } from "../../context/AuthProvider";
import Loader from "../generate/loader";
import { LanguageContext } from "../Language";
import axiosInstance from "../../apiConfig/apiRequests";
import OrdersModal from "../modal/OrdersModal";
import OrdersModalEdit from "../modal/OrdersModalEdit";
import OrdersModalTimePicker from "../modal/OrdersModalTimePicker";
import ErrorDisplay from "../generate/ErrorDisplay";
import useErrorHandler from "../../hooks/useErrorHandler";
import eventEmitter from "../../utils/EventEmitter";

import NotificationSound from '../../utils/NotificationSound';
import NotificationManager from '../../utils/NotificationManager';
import { orderReducer, initialState } from '../../reducers/orderReducer';
import OrderCard from "./OrderCard";
import { handleDelaySet, handleSetDeliveryScheduled } from '../../utils/timeUtils';
import debounce from 'lodash.debounce';
import { useOrderDetails } from "../../hooks/useOrderDetails";
import { CONNECTION_EVENTS } from "../../utils/connectionMonitor";

// This will be replaced with a dynamic calculation based on screen size
const initialWidth = Dimensions.get("window").width;
const getColumnsByScreenSize = (screenWidth) => {
  if (screenWidth < 750) return 1; // Mobile phones
  if (screenWidth < 960) return 2; // Tablets
  return 3; // Larger screens
};

const initialColumns = getColumnsByScreenSize(initialWidth);
const getCardSize = (width, columns) => width / columns - (columns > 1 ? 15 : 30);

const calculateCardSize = (width, columns) => {
  const marginBetweenCards = 10;
  const totalMargin = marginBetweenCards * (columns + 1);
  return (width - totalMargin) / columns;
};
let newOrderCount;
const type = 0;

export const EnteredOrdersList = () => {
  const { domain, branchid, user } = useAuthState();
  const { dictionary, languageId } = useContext(LanguageContext);
  const [state, dispatch] = useReducer(orderReducer, initialState);
  // Use the custom hook for order details management
  const {
    orderDetails,
    loadingDetails,
    fetchBatchOrderDetails,
    fetchOrderDetailsLazy,
    fetchSingleOrderDetails,
    isOrderDetailsLoaded,
    isOrderLoading,
    clearOrderDetails,
    invalidateOrderDetails,
    getOrderDetails
  } = useOrderDetails();
  
  const NotificationSoundRef = useRef(null);
  const soundRef = useRef(null);
  const intervalRef = useRef(null);
  const [width, setWidth] = useState(Dimensions.get('window').width);
  const [numColumns, setNumColumns] = useState(getColumnsByScreenSize(initialWidth));
  const [cardSize, setCardSize] = useState(getCardSize(width, numColumns));
  const [retryCount, setRetryCount] = useState(0);
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState('postpone'); // 'postpone' | 'schedule'
  const [editOrder, setEditOrder] = useState(null);
  const [appState, setAppState] = useState(AppState.currentState);
  const [isConnected, setIsConnected] = useState(true);
  const [isLanguageChangeLoading, setIsLanguageChangeLoading] = useState(false);
  const { error, setError, setApiError, clearError } = useErrorHandler();
  const [options, setOptions] = useState({
    url_unansweredOrders: "",
    url_deliveronRecheck: "",
    url_acceptOrder: "",
    url_rejectOrder: "",
    url_pushToken: "",
    url_updateOrderCart: "",
    url_setDeliveryScheduled: "",
  });
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false);
  const processedOrdersRef = useRef(new Set());
  const lastOrdersRef = useRef(new Set());
  const isInitialFetchRef = useRef(true);
  const isLanguageChangeInProgressRef = useRef(false);
  const isComponentMountedRef = useRef(false);
  const isFirstAppLaunchRef = useRef(true); // Track if this is the very first app launch
  const hasShownInitialAlertRef = useRef(false); // Track if we've shown initial load alert
  const shownAlertsRef = useRef(new Set()); // Track shown alert order IDs to prevent duplicates
  const abortControllerRef = useRef(null); // For cancelling in-flight requests
  const lastRequestTimestampRef = useRef(0); // Track request timestamps to prevent stale responses
  const [layoutKey, setLayoutKey] = useState(0);
  const ordersRef = useRef(state.orders);
  const loadingRef = useRef(state.loading);
  const retryCountRef = useRef(retryCount);
  const startIntervalRef = useRef(null);
  const debouncedFetchRef = useRef(null);
  const fetchEnteredOrdersRef = useRef(null);

  useEffect(() => {
    ordersRef.current = state.orders;
  }, [state.orders]);

  useEffect(() => {
    loadingRef.current = state.loading;
  }, [state.loading]);

  useEffect(() => {
    retryCountRef.current = retryCount;
  }, [retryCount]);

  const MAX_RETRIES = 15;
  const RETRY_DELAY = 5000;
  const FETCH_INTERVAL = 3000;
  const DEBOUNCE_DELAY = 300;
  const LOADER_TIMEOUT = 10000; // 10 seconds max for loader

  // Loader failsafe - force hide loader after timeout
  useEffect(() => {
    let loaderTimeout;
    
    if (state.loading) {
      loaderTimeout = setTimeout(() => {
        dispatch({ type: 'SET_LOADING', payload: false });
      }, LOADER_TIMEOUT);
    }
    
    return () => {
      if (loaderTimeout) {
        clearTimeout(loaderTimeout);
      }
    };
  }, [state.loading]);

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

  const apiOptions = useCallback(() => {
    setOptions({
      url_unansweredOrders: `https://${domain}/api/v1/admin/getUnansweredOrders`,
      url_delayOrders: `https://${domain}/api/v1/admin/postponeOrder`,
      url_deliveronRecheck: `https://${domain}/api/v1/admin/deliveronRecheck`,
      url_acceptOrder: `https://${domain}/api/v1/admin/acceptOrder`,
      url_rejectOrder: `https://${domain}/api/v1/admin/rejectOrder`,
      url_pushToken: `https://${domain}/api/v1/admin/storePushToken`,
      url_updateOrderCart: `https://${domain}/api/v1/admin/updateOrderCart`,
      url_setDeliveryScheduled: `https://${domain}/api/v1/admin/setDeliveryScheduled`,
    });
    setOptionsIsLoaded(true);
  }, [domain]);

  const fetchEnteredOrders = useCallback(async () => {
    if (!user || !options.url_unansweredOrders || global.isLoggedOut) {
      if (__DEV__) {
        console.log('[EnteredOrdersList] Skipped fetchEnteredOrders: no user, no url, or logged out');
      }
      return;
    }

    const wasFirstAppLaunch = isFirstAppLaunchRef.current;
    const wasInitialFetch = isInitialFetchRef.current;

    // Only show loader for the very first app launch or initial fetch
    const shouldShowLoader = wasFirstAppLaunch && wasInitialFetch;
    if (__DEV__) {
      console.log('fetchEnteredOrders: shouldShowLoader=', shouldShowLoader, {
        wasFirstAppLaunch,
        wasInitialFetch,
        isLanguageChangeInProgress: isLanguageChangeInProgressRef.current
      });
    }

    if (shouldShowLoader) {
      if (__DEV__) {
        console.log('Setting loading to true for initial fetch');
      }
      dispatch({ type: 'SET_LOADING', payload: true });
    }

    try {
      lastRequestTimestampRef.current = Date.now();

      const resp = await axiosInstance.post(
        options.url_unansweredOrders,
        {
          type: 0,
          page: 1,
          branchid,
          Languageid: languageId,
          postponeOrder: false,
          excludeDeliveryScheduled: true,
        },
        { signal: abortControllerRef.current?.signal }
      );

      const newOrders = resp.data.data;
      const newOrderIds = newOrders.map(o => o.id);
      const currentOrderIds = ordersRef.current.map(o => o.id);

      const isFirstFetch = wasInitialFetch && !isLanguageChangeInProgressRef.current;
      const isFirstLoad = ordersRef.current.length === 0 && newOrders.length > 0;

      const genuinelyNewOrders = newOrders.filter(order => !lastOrdersRef.current.has(order.id));
      const genuinelyNewOrderIds = genuinelyNewOrders.map(o => o.id);

      const shouldShowInitialAlert =
        (wasFirstAppLaunch || isFirstFetch || isFirstLoad) &&
        newOrders.length > 0 &&
        !isLanguageChangeInProgressRef.current &&
        !hasShownInitialAlertRef.current;

      const shouldShowRuntimeAlert =
        genuinelyNewOrderIds.length > 0 &&
        !isLanguageChangeInProgressRef.current &&
        !wasFirstAppLaunch;

      const showAlert = shouldShowInitialAlert || shouldShowRuntimeAlert;

      if (showAlert) {
        const alertKey = (shouldShowInitialAlert ? newOrderIds : genuinelyNewOrderIds)
          .sort()
          .join('-');

        if (!shownAlertsRef.current.has(alertKey)) {
          shownAlertsRef.current.add(alertKey);

          if (shouldShowInitialAlert) {
            hasShownInitialAlertRef.current = true;
          }

          NotificationSoundRef.current?.orderReceived?.().catch(error => {
            console.warn("🔈 Sound error:", error);
          });
        }
      }

      // Fetch cart details for any orders not yet loaded (initial + newly arrived)
      const ordersNeedingDetails = newOrderIds.filter(id => !isOrderDetailsLoaded(id));

      if (ordersNeedingDetails.length > 0 && !isLanguageChangeInProgressRef.current) {
        try {
          await fetchBatchOrderDetails(ordersNeedingDetails, false);
        } catch (e) {
          console.error('❌ Order detail fetch failed', e);
        }
      }

      if ((isFirstFetch || isFirstLoad) && !isLanguageChangeInProgressRef.current) {
        isInitialFetchRef.current = false;
      }

      // Track seen order IDs so runtime alerts only fire for true newcomers
      newOrderIds.forEach(id => lastOrdersRef.current.add(id));

      dispatch({
        type: 'SET_ORDERS',
        payload: {
          orders: newOrders,
          fees: resp.data.fees,
          currency: resp.data.currency,
          scheduled: resp.data.scheduled,
          loading: false
        }
      });

      eventEmitter.emit('orderBadgeUpdate', { type: 0, count: newOrders.length });

      // Always ensure loading is false after fetch
      if (loadingRef.current) {
        if (__DEV__) {
          console.log('Forcing loading to false after fetch');
        }
        dispatch({ type: 'SET_LOADING', payload: false });
      }

      // Reset flags
      if (wasInitialFetch) {
        isInitialFetchRef.current = false;
      }
      if (wasFirstAppLaunch) {
        isFirstAppLaunchRef.current = false;
      }

      setRetryCount(0);
    } catch (error) {
      const isCancelled =
        error.name === 'AbortError' ||
        error.code === 'ERR_CANCELED' ||
        error.message?.includes('canceled');

      if (isCancelled) {
        if (__DEV__) {
          console.log('🚫 Request was cancelled');
        }
        return;
      }

      console.error('Fetch error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });

      if (wasInitialFetch) {
        isInitialFetchRef.current = false;
      }
      if (wasFirstAppLaunch) {
        isFirstAppLaunchRef.current = false;
      }

      if (retryCountRef.current < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        if (intervalRef.current) clearInterval(intervalRef.current);
        setTimeout(() => startIntervalRef.current?.(), RETRY_DELAY);
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        handleReload();
      }
    }
  }, [
    user,
    options.url_unansweredOrders,
    branchid,
    languageId,
    isOrderDetailsLoaded,
    fetchBatchOrderDetails
  ]);

  useEffect(() => {
    fetchEnteredOrdersRef.current = fetchEnteredOrders;
  }, [fetchEnteredOrders]);

  useEffect(() => {
    debouncedFetchRef.current = debounce(() => {
      if (optionsIsLoaded && user && options.url_unansweredOrders && !global.isLoggedOut) {
        fetchEnteredOrdersRef.current?.();
      }
    }, DEBOUNCE_DELAY);

    return () => {
      debouncedFetchRef.current?.cancel?.();
    };
  }, [optionsIsLoaded, user, options.url_unansweredOrders]);

  const startInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    // Prevent polling if logged out or no user
    if (!user || global.isLoggedOut) return;
    intervalRef.current = setInterval(() => {
      debouncedFetchRef.current?.();
    }, FETCH_INTERVAL);
  }, [user]);

  useEffect(() => {
    startIntervalRef.current = startInterval;
  }, [startInterval]);

  const handleRefresh = useCallback(() => {
    debouncedFetchRef.current?.();
  }, []);

  
  const initializeNotifications = async () => {
    try {
      await NotificationManager.initialize(options, branchid, NotificationSoundRef);
    } catch (error) {
      console.error('Error initializing NotificationManager:', error);
    }
  };


  const handleAppStateChange = useCallback((nextAppState) => {
    if (appState.match(/inactive|background/) && nextAppState === "active") {
      if (!isLanguageChangeInProgressRef.current) {
        lastOrdersRef.current.clear();
        shownAlertsRef.current.clear(); // Clear shown alerts on app resume
      }
      startIntervalRef.current?.();
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
      dispatch({ type: 'SET_ORDERS', payload: { orders: [], fees: [], currency: "", scheduled: [], loading: false }});
      // Clear order details cache when switching domains/branches
      clearOrderDetails();
      // Clear alert tracking when switching domains/branches
      shownAlertsRef.current.clear();
      lastOrdersRef.current.clear();
      // Stop any playing sound when switching domains/branches
      if (NotificationSoundRef?.current?.stopSound) {
        NotificationSoundRef.current.stopSound();
      }
    }
  }, [domain, branchid, apiOptions, clearOrderDetails]);

  // Monitor internet connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connectionStatus = state.isConnected && state.isInternetReachable !== false;
      setIsConnected(connectionStatus);
      
      if (connectionStatus && !isConnected && !isLanguageChangeInProgressRef.current) {
        // Connection restored, restart interval (but not during language change)
        if (optionsIsLoaded) {
          startIntervalRef.current?.();
        }
      } else if (!connectionStatus && isConnected) {
        // Connection lost, stop interval and clear alerts
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        // Stop any playing sound when connection is lost
        if (NotificationSoundRef?.current?.stopSound) {
          NotificationSoundRef.current.stopSound();
        }
      }
    });
    
    return () => unsubscribe();
  }, [isConnected, optionsIsLoaded]);

  useEffect(() => {
    if (optionsIsLoaded && !isLanguageChangeInProgressRef.current) {
      const subscribe = AppState.addEventListener('change', handleAppStateChange);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (isConnected && user && !global.isLoggedOut) {
        startIntervalRef.current?.();
      }

      // Listen for forceLogout event to clear interval
      const logoutListener = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
      const logoutListenerId = eventEmitter.addEventListener('forceLogout', logoutListener);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        dispatch({ type: 'UPDATE_ORDER_COUNT', payload: 0 });
        subscribe.remove();
        eventEmitter.removeEventListener(logoutListenerId);
      };
    }
  }, [optionsIsLoaded, appState, isConnected, user]);

  // Separate effect for language changes - force initial fetch  
  useEffect(() => {
    if (!isComponentMountedRef.current) {
      isComponentMountedRef.current = true;
      return;
    }

    if (optionsIsLoaded && user && options.url_unansweredOrders) {
      if (__DEV__) {
        console.log(`🔄 User manually changed language to ${languageId}, forcing complete refresh`);
      }
      setIsLanguageChangeLoading(true);
      isLanguageChangeInProgressRef.current = true;
      isFirstAppLaunchRef.current = false;
      lastOrdersRef.current.clear();
      shownAlertsRef.current.clear();

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      (async () => {
        try {
          const languageChangeTimestamp = Date.now();
          lastRequestTimestampRef.current = languageChangeTimestamp;

          if (languageChangeTimestamp < lastRequestTimestampRef.current) {
            console.log('🚫 Ignoring stale language change response', {
              responseTimestamp: languageChangeTimestamp,
              latestTimestamp: lastRequestTimestampRef.current,
            });
            return;
          }

          const languageResponse = await axiosInstance.post(
            options.url_unansweredOrders,
            {
              type: 0,
              page: 1,
              branchid: branchid,
              Languageid: languageId,
              postponeOrder: false,
              excludeDeliveryScheduled: true,
            },
            { signal: abortControllerRef.current?.signal }
          );

          const newOrders = languageResponse.data.data;
          const newOrderIds = newOrders.map(order => order.id);

          dispatch({
            type: 'SET_ORDERS',
            payload: {
              orders: newOrders,
              fees: languageResponse.data.fees,
              currency: languageResponse.data.currency,
              scheduled: languageResponse.data.scheduled,
              loading: false,
            },
          });

          if (newOrderIds.length > 0) {
            await fetchBatchOrderDetails(newOrderIds, false);
          }

          newOrders.forEach(order => lastOrdersRef.current.add(order.id));
          isLanguageChangeInProgressRef.current = false;

          if (!loadingDetails) {
            setIsLanguageChangeLoading(false);
          }

          if (isConnected) {
            startIntervalRef.current?.();
          }
        } catch (error) {
          if (
            error.name === 'AbortError' ||
            error.code === 'ERR_CANCELED' ||
            error.message?.includes('canceled') ||
            error.originalError?.name === 'CanceledError' ||
            (error.originalError && error.originalError.toString().includes('canceled'))
          ) {
            console.log('🚫 Language change request was cancelled - this is expected during language switching');
            return;
          }

          isLanguageChangeInProgressRef.current = false;
          if (!loadingDetails) {
            setIsLanguageChangeLoading(false);
          }
          if (isConnected) {
            startIntervalRef.current?.();
          }
        }
      })();
    }
  }, [languageId, loadingDetails, fetchBatchOrderDetails, optionsIsLoaded, user, options.url_unansweredOrders, branchid, isConnected, startInterval]);

  // Monitor loadingDetails and hide language change loader when details are fully loaded
  useEffect(() => {
    if (isLanguageChangeInProgressRef.current === false && isLanguageChangeLoading && !loadingDetails) {
      setIsLanguageChangeLoading(false);
    }
  }, [loadingDetails, isLanguageChangeLoading]);

  // Initialize notifications
  useEffect(() => {
    if (!optionsIsLoaded) return;
    initializeNotifications();
  }, [optionsIsLoaded]);

  const handleReload = async () => {
    await Updates.reloadAsync();
  };

  const handleToggleContent = useCallback((id) => {
    dispatch({ type: 'TOGGLE_CONTENT', payload: id });

    // Lazy load when expanding if details are missing (or prior fetch failed)
    if (!state.isOpen.includes(id) && !isOrderDetailsLoaded(id)) {
      fetchOrderDetailsLazy(id);
    }
  }, [state.isOpen, isOrderDetailsLoaded, fetchOrderDetailsLazy]);

  const handleAcceptOrder = useCallback(async (itemId, itemTakeAway) => {
    try {
      // Check internet connection first
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected || netInfo.isInternetReachable === false) {
        dispatch({ type: 'SET_LOADING', payload: false });
        Alert.alert(
          dictionary["general.alerts"] || "შეტყობინება",
          dictionary["connection.required"] || "ინტერნეტ კავშირი საჭიროა შეკვეთების დასამუშავებლად",
          [{ text: dictionary["okay"] || "კარგი" }]
        );
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });

      if (itemTakeAway === 1) {
        // Set both modal state and loading state in a single batch
        dispatch({
          type: 'BATCH_UPDATE',
          payload: {
            loading: false,
            modalState: {
              visible: true,
              modalType: 'accept',
              itemId: itemId,
              itemTakeAway: itemTakeAway
            }
          }
        });
        return;
      }

      const response = await axiosInstance.post(options.url_deliveronRecheck, {
        orderId: itemId,
      });

      // Prepare state updates to be dispatched together
      const updates = { loading: false };

      if (response.data?.data?.original?.content.length !== 0) {
        updates.deliveron = response.data.data;
        updates.modalState = {
          visible: true,
          modalType: 'accept',
          itemId: itemId,
          itemTakeAway: itemTakeAway
        };

        // Dispatch all state updates in a single action
        dispatch({
          type: 'BATCH_UPDATE',
          payload: updates
        });
      } else if (response.data?.data?.original?.content.length === 0) {
        dispatch({
          type: 'BATCH_UPDATE',
          payload: {
            loading: false,
            deliveron: []
          }
        });

        Alert.alert("ALERT", dictionary["dv.empty"] || "მიწოდების ინფორმაცია ცარიელია", [
          {
            text: dictionary["okay"] || "კარგი",
            onPress: () => {
              dispatch({
                type: 'SET_DELIVERON_DATA',
                payload: []
              });
            }
          },
        ]);
      }
    } catch (error) {
      console.error('Error in handleAcceptOrder:', error);
      dispatch({
        type: 'BATCH_UPDATE',
        payload: {
          loading: false,
          deliveron: []
        }
      });
    }
  }, [options.url_deliveronRecheck, dictionary]);

  const handleRejectOrder = useCallback(async (id) => {
    // Check internet connection first
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected || netInfo.isInternetReachable === false) {
      dispatch({ type: 'SET_LOADING', payload: false });
      Alert.alert(
        dictionary["general.alerts"] || "შეტყობინება",
        dictionary["connection.required"] || "ინტერნეტ კავშირი საჭიროა შეკვეთების დასამუშავებლად",
        [{ text: dictionary["okay"] || "კარგი" }]
      );
      return;
    }
    
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
    setPickerMode('postpone');
    setPickerVisible(true);
    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  const handleScheduleOrder = useCallback((id) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_MODAL_STATE', payload: { itemId: id } });
    setPickerMode('schedule');
    setPickerVisible(true);
    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  const handleModalClose = useCallback(() => {
    dispatch({ type: 'RESET_MODAL_STATE' });
  }, []);

  const handleDelaySetWrapper = useCallback(async (delay) => {
    if (pickerMode === 'schedule') {
      await handleSetDeliveryScheduled({
        delay,
        itemId: state.itemId,
        options,
        dictionary,
        setLoadingOptions: (value) => dispatch({ type: 'SET_LOADING_OPTIONS', payload: value }),
        setPickerVisible,
        setLoading: (value) => dispatch({ type: 'SET_LOADING', payload: value }),
        onSuccess: async () => {
          await fetchEnteredOrdersRef.current?.();
        },
      });
      return;
    }

    const params = {
      delay,
      deliveryScheduled: state.deliveryScheduled,
      scheduled: state.scheduled,
      itemId: state.itemId,
      options,
      dictionary,
      setLoadingOptions: (value) => dispatch({ type: 'SET_LOADING_OPTIONS', payload: value }),
      setPostponeOrder: (value) => dispatch({ type: 'SET_POSTPONE_ORDER', payload: value }),
      setPickerVisible,
      setLoading: (value) => dispatch({ type: 'SET_LOADING', payload: value })
    };

    await handleDelaySet(params);
  }, [pickerMode, state.deliveryScheduled, state.scheduled, state.itemId, options, dictionary]);

  const handleEditOrder = useCallback(async (item) => {
    const orderIdStr = String(item.id);
    let details = getOrderDetails(orderIdStr);
    if (!details || details.length === 0) {
      details = await fetchSingleOrderDetails(orderIdStr);
    }
    setEditOrder({ order: item, orderData: details || [] });
  }, [getOrderDetails, fetchSingleOrderDetails]);

  const handleEditClose = useCallback(() => {
    setEditOrder(null);
  }, []);

  const handleOrderUpdated = useCallback(async (orderId) => {
    invalidateOrderDetails(orderId);
    await fetchEnteredOrdersRef.current?.();
    if (state.isOpen.includes(orderId)) {
      await fetchSingleOrderDetails(String(orderId));
    }
  }, [invalidateOrderDetails, state.isOpen, fetchSingleOrderDetails]);

  // Memoize order details per order to avoid unnecessary re-renders
  const renderOrderCard = useCallback(({ item }) => {
    const orderDataForItem = getOrderDetails(item.id) || [];
    const detailsLoading = isOrderLoading(item.id) ||
      (state.isOpen.includes(item.id) && !isOrderDetailsLoaded(item.id));
    return (
      <View style={{
        width: cardSize,
        marginHorizontal: 5
      }}>
        <OrderCard
          key={item.id}
          item={item}
          currency={state.currency}
          isOpen={state.isOpen.includes(item.id)}
          fees={state.fees}
          scheduled={state.scheduled}
          dictionary={dictionary}
          orderData={orderDataForItem}
          detailsLoading={detailsLoading}
          onToggle={handleToggleContent}
          onAccept={handleAcceptOrder}
          onDelay={handleDelayOrder}
          onSchedule={handleScheduleOrder}
          onReject={handleRejectOrder}
          onEdit={handleEditOrder}
          loading={state.loading}
        />
      </View>
    );
  }, [state.currency, state.isOpen, state.fees, state.scheduled, state.loading, dictionary, getOrderDetails, isOrderLoading, isOrderDetailsLoaded, handleToggleContent, handleAcceptOrder, handleDelayOrder, handleScheduleOrder, handleRejectOrder, handleEditOrder, cardSize]);

  const keyExtractor = useCallback((item) => String(item.id), []);

  // Provide getItemLayout for FlatList performance
  const getItemLayout = useCallback((data, index) => {
    return {
      length: cardSize,
      offset: cardSize * index,
      index,
    };
  }, [cardSize]);

  // Reset processed orders when component unmounts or app goes to background
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'background') {
        processedOrdersRef.current.clear();
        shownAlertsRef.current.clear();
        hasShownInitialAlertRef.current = false;
        if (NotificationSoundRef?.current?.stopSound) {
          NotificationSoundRef.current.stopSound();
        }
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
      processedOrdersRef.current.clear();
      shownAlertsRef.current.clear();
      hasShownInitialAlertRef.current = false;
      setIsLanguageChangeLoading(false);
      isLanguageChangeInProgressRef.current = false;
      isFirstAppLaunchRef.current = true;
      if (NotificationSoundRef?.current?.stopSound) {
        NotificationSoundRef.current.stopSound();
      }
    };
  }, []);

  useEffect(() => {
    // Listen for forceLogout event to clear all orders and state
    const logoutListener = () => {
      dispatch({ type: 'RESET_ALL_STATE' });
      processedOrdersRef.current.clear();
      shownAlertsRef.current.clear();
      hasShownInitialAlertRef.current = false;
      setIsLanguageChangeLoading(false);
      isLanguageChangeInProgressRef.current = false;
      isFirstAppLaunchRef.current = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (NotificationSoundRef?.current?.stopSound) {
        NotificationSoundRef.current.stopSound();
      }
    };
    const logoutListenerId = eventEmitter.addEventListener('forceLogout', logoutListener);

    const retryListenerId = eventEmitter.addEventListener(CONNECTION_EVENTS.RETRY, () => {
      fetchEnteredOrdersRef.current?.();
      startIntervalRef.current?.();
    });

    return () => {
      eventEmitter.removeEventListener(logoutListenerId);
      eventEmitter.removeEventListener(retryListenerId);
    };
  }, []);

  return (
    <View style={styles.container}>
      {state.loadingOptions && <Loader />}
      <NotificationSound ref={NotificationSoundRef} />
      {(state.loading || isLanguageChangeLoading) && <Loader show={state.loading || isLanguageChangeLoading} />}
      {!isLanguageChangeLoading && (
        <>
          <ErrorDisplay 
            error={error} 
            onDismiss={clearError} 
            style={styles.errorDisplay} 
          />
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
          <OrdersModalEdit
            visible={!!editOrder}
            onClose={handleEditClose}
            order={editOrder?.order}
            orderData={editOrder?.orderData}
            currency={state.currency}
            updateUrl={options.url_updateOrderCart}
            onUpdated={handleOrderUpdated}
          />
          <OrdersModalTimePicker
            visible={isPickerVisible}
            initialMinutes={30}
            loading={state.loadingOptions}
            title={
              pickerMode === "schedule"
                ? dictionary["orders.scheduleOrder"]
                : dictionary["orders.postponeOrder"] || dictionary["orders.scheduleOrder"]
            }
            onConfirm={handleDelaySetWrapper}
            onClose={() => {
              setPickerVisible(false);
              setPickerMode("postpone");
              dispatch({ type: "SET_LOADING_OPTIONS", payload: false });
            }}
          />
          <FlatList
            key={`flat-list-${numColumns}`}
            data={state.orders}
            renderItem={renderOrderCard}
            keyExtractor={keyExtractor}
            numColumns={numColumns}
            getItemLayout={getItemLayout}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
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
            onRefresh={handleRefresh}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorDisplay: {
    zIndex: 1000, 
    width: '92%',
    alignSelf: 'center',
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