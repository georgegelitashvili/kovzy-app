import React, { useState, useEffect, useCallback, createContext, useContext, memo, useMemo } from "react";
import {
  StyleSheet,
  Dimensions,
  View,
  TouchableOpacity,
  Linking,
  Alert,
  RefreshControl,
  FlatList
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Text, Divider, Card } from "react-native-paper";
import { FlatGrid } from "react-native-super-grid";
import {
  MaterialCommunityIcons,
  SimpleLineIcons,
} from "@expo/vector-icons";

import { AuthContext } from "../../context/AuthProvider";

import Loader from "../generate/loader";
import { LanguageContext } from "../Language";
import axiosInstance from "../../apiConfig/apiRequests";
import OrdersDetail from "../OrdersDetail";
import OrdersModal from "../modal/OrdersModal";
import printRows from "../../PrintRows";
import { useOrderDetails } from "../../hooks/useOrderDetails";
import eventEmitter from "../../utils/EventEmitter";

// This will be replaced with a dynamic calculation based on screen size
const initialWidth = Dimensions.get("window").width;
const getColumnsByScreenSize = (screenWidth) => {
  if (screenWidth < 600) return 1; // Mobile phones
  if (screenWidth < 960) return 2; // Tablets
  return 3; // Larger screens
};

const initialColumns = getColumnsByScreenSize(initialWidth);
const getCardSize = (width, columns) => width / columns - (columns > 1 ? 15 : 30);

export const AcceptedOrdersList = () => {
  const { domain, branchid, setUser, user, deleteItem, setIsDataSet, intervalId } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [fees, setFees] = useState([]);
  const [currency, setCurrency] = useState("");

  // Use the custom hook for order details management
  const {
    orderDetails,
    loadingDetails,
    fetchBatchOrderDetails,
    fetchOrderDetailsLazy,
    clearOrderDetails,
    getOrderDetails
  } = useOrderDetails();

  const [page, setPage] = useState(0);
  const [options, setOptions] = useState({
    url_getAcceptedOrders: "",
    url_deliveronStatus: "",
    url_checkOrderStatus: "",
    url_orderPrepared: "",
    url_rejectOrder: "",
  }); // api options
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false);
  const [deliveronOptions, setDeliveronOptions] = useState({});
  const [isDeliveronOptions, setIsDeliveronOptions] = useState(false);
  const [deliveron, setDeliveron] = useState([]);
  const [visible, setVisible] = useState(false);
  const [itemId, setItemId] = useState(null);
  const [isOpen, setOpenState] = useState([]);
  const [modalType, setModalType] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [width, setWidth] = useState(Dimensions.get('window').width);
  const [numColumns, setNumColumns] = useState(getColumnsByScreenSize(width));
  const [cardSize, setCardSize] = useState(getCardSize(width, numColumns));

  const { dictionary, languageId } = useContext(LanguageContext);

  const increment = () => { setPage(page + 1); setLoading(true) };
  const decrement = () => { setPage(page - 1); setLoading(true) };

  const toggleContent = useCallback((value) => {
    if (isOpen.includes(value)) {
      setOpenState(isOpen.filter((i) => i !== value));
    } else {
      setOpenState([...isOpen, value]);
      
      // Lazy load: fetch order details when expanding if not already loaded
      if (!getOrderDetails(value) || getOrderDetails(value).length === 0) {
        fetchOrderDetailsLazy(value);
      }
    }
  }, [isOpen, getOrderDetails, fetchOrderDetailsLazy]);

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
      url_getAcceptedOrders: `https://${domain}/api/v1/admin/getAcceptedOrders`,
      url_deliveronStatus: `https://${domain}/api/v1/admin/deliveronStatus`,
      url_checkOrderStatus: `https://${domain}/api/v1/admin/checkOrderStatus`,
      url_orderPrepared: `https://${domain}/api/v1/admin/orderPrepared`,
      url_rejectOrder: `https://${domain}/api/v1/admin/rejectOrder`,
    });
    setOptionsIsLoaded(true);
  }, [domain]);

  const showModal = (type) => {
    setModalType(type);
    setVisible(true);
  };

  const fetchAcceptedOrders = useCallback(async () => {
    setOptionsIsLoaded(true);
    try {
      if (!user || !options.url_getAcceptedOrders) {
        return null;
      }

      const resp = await axiosInstance.post(options.url_getAcceptedOrders, JSON.stringify({
        Pagination: {
          limit: 12,
          page: page
        },
        Languageid: languageId,
        branchid: branchid,
        type: 0
      }));
      const data = resp.data.data;
      const feesData = resp.data.fees;
      setOrders(data);
      setFees(feesData);
      setCurrency(resp.data.currency);
      
      // Non-blocking background fetch of order details
      if (data && data.length > 0) {
        const orderIds = data.map(order => order.id);
        // Don't wait for order details - fetch in background
        fetchBatchOrderDetails(orderIds, false);
      }
    } catch (error) {
      console.log('Error fetching accepted orders full:', error);
      const statusCode = error?.status || 'Unknown';
      console.log('Status code accepted orders:', statusCode);
      clearInterval(intervalId);
    } finally {
      setLoading(false);
    }
  }, [user, options.url_getAcceptedOrders, page, languageId, branchid, intervalId, fetchBatchOrderDetails]);

  const onChangeModalState = useCallback((newState) => {
    setVisible(newState);
    if (!newState) {  // If the modal is closed
      setLoading(false);  // Reset loading state
      setLoadingOptions(false);  // Reset options loading state
      setItemId(null);
      // Only refetch if the modal action might have changed order status
      // For now, we'll keep the current data and let the user manually refresh if needed
    }
  }, []);

  useEffect(() => {
    if (domain && branchid) {
      apiOptions();
    } else if (domain || branchid) {
      setOptionsIsLoaded(false);
      setOrders([]);
      // Clear order details cache when switching domains/branches
      clearOrderDetails();
    }
    // Listen for forceLogout event to clear all orders and state
    const logoutListener = () => {
      setOrders([]);
      setFees([]);
      setCurrency("");
      setOpenState([]);
      setVisible(false);
      setItemId(null);
      setModalType("");
    };
    eventEmitter.addEventListener('forceLogout', logoutListener);
    return () => {
      eventEmitter.removeEventListener(logoutListener);
    };
  }, [domain, branchid, apiOptions, clearOrderDetails]);
  
  // Optimize useFocusEffect to prevent excessive API calls
  const fetchOrdersCallback = React.useCallback(() => {
    fetchAcceptedOrders();
    return () => {};
  }, [fetchAcceptedOrders]);

  useFocusEffect(fetchOrdersCallback);

  useEffect(() => {
    if (itemId) {
      setIsDeliveronOptions(true);
      setLoadingOptions(true);
    }
  }, [itemId]);

  useEffect(() => {
    if (deliveron) {
      setLoadingOptions(false);
    }
  }, [deliveron]);

  useEffect(() => {
    if (isDeliveronOptions) {
      axiosInstance.post(options.url_deliveronStatus).then((resp) => {
        setDeliveron(resp.data.data);
      });
    }
  }, [isDeliveronOptions]);

  const openURLInBrowser = async (url) => {
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(`Don't know how to open this URL: ${url}`);
    }
  };

  // Memoize the order item renderer to prevent unnecessary re-renders
  const RenderEnteredOrdersList = React.memo(({ item }) => {
    const trackLink = [JSON.parse(item.deliveron_data)]?.map(link => {
      return link.trackLink ?? null;
    });

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

              <Text variant="titleSmall" style={styles.title} numberOfLines={2} ellipsizeMode="tail">
                {dictionary["orders.address"]}: {item.address}
              </Text>

              {trackLink[0] ? (
                <TouchableOpacity onPress={() => openURLInBrowser(trackLink[0].toString())}>
                  <Text variant="titleSmall" style={styles.title}>
                    {"Tracking link:"} <Text style={[styles.title, { color: '#3490dc' }]}>{trackLink[0]}</Text>
                  </Text>
                </TouchableOpacity>
              ) : null}

              {item.delivery_scheduled ? (
                <Text variant="titleSmall" style={styles.title} numberOfLines={2} ellipsizeMode="tail">
                  {dictionary["orders.scheduledDeliveryTime"]}: {item.delivery_scheduled}
                </Text>
              ) : null}

              {item.comment ? (
                <Text variant="titleSmall" style={styles.title}>
                  {dictionary["orders.comment"]}: {item.comment}
                </Text>
              ) : null}

              <Text variant="titleSmall" style={styles.title} numberOfLines={2} ellipsizeMode="tail">
                {dictionary["orders.paymentMethod"]}: {item.payment_type}
              </Text>

              <Divider />
                <OrdersDetail orderId={item.id} orderData={getOrderDetails(item.id) || []} />
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
                    showModal("status");
                  }}
                >
                  <MaterialCommunityIcons name="check-decagram-outline" size={30} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.buttonReject}
                  onPress={() => {
                    setItemId(item.id);
                    showModal("reject");
                  }}
                >
                  <MaterialCommunityIcons name="close-circle-outline" size={30} color="white" />
                </TouchableOpacity>
              </Card.Actions>

            </Card.Content>
          ) : null}
        </Card>
      </View>
    );  }, (prevProps, nextProps) => {
      return prevProps.item.id === nextProps.item.id &&
             JSON.stringify(prevProps.item) === JSON.stringify(nextProps.item);
    });

  const getItemLayout = useCallback((data, index) => ({
    length: cardSize,
    offset: cardSize * index,
    index,
  }), [cardSize]);

  return (
    <View style={styles.container}>
      {loadingOptions && <Loader />}
      {(loading || loadingDetails) && <Loader show={loading || loadingDetails} />}
      
      {visible && (
        <OrdersModal
          isVisible={visible}
          onChangeState={onChangeModalState}
          orders={orders}
          hasItemId={itemId}
          deliveron={deliveron}
          deliveronOptions={deliveronOptions}
          type={modalType}
          options={options}
          PendingOrders={false}
        />
      )}
      
      <FlatList
        key={`flat-list-${numColumns}`}
        numColumns={numColumns}
        getItemLayout={getItemLayout}
        itemDimension={cardSize}
        data={orders}
        spacing={10}
        renderItem={({ item }) => <RenderEnteredOrdersList item={item} />}
        keyExtractor={useCallback((item) => (item && item.id ? item.id.toString() : ''), [])}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchAcceptedOrders} />
        }
        ListFooterComponent={
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              onPress={decrement}
              disabled={page === 0}
            >
              <Text style={[styles.paginationButton, page === 0 && styles.paginationButtonDisabled]}>
                {dictionary["prevPage"]}
              </Text>
            </TouchableOpacity>
            <Text style={styles.paginationText}>{page}</Text>
            <TouchableOpacity
              onPress={increment}
              disabled={page === Math.ceil(increment)}
            >
              <Text
                style={[
                  styles.paginationButton,
                  page === Math.ceil(increment) && styles.paginationButtonDisabled,
                ]}
              >
                {dictionary["nextPage"]}
              </Text>
            </TouchableOpacity>
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
    flexWrap: 'nowrap',
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
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    marginBottom: 15,
  },
  paginationButton: {
    backgroundColor: "#ccc",
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginHorizontal: 5,
    borderRadius: 5,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationText: {
    fontSize: 17,
    fontWeight: "bold",
  },
  feeDetailsContainer: {
    paddingLeft: 10,
    marginBottom: 15
  },
  feeDetailText: {
    fontSize: 15,
  },
});
