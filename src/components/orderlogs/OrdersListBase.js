import React, { useState, useEffect, useCallback, useContext, useRef, memo } from "react";
import {
  StyleSheet,
  Dimensions,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Text, Divider, Card } from "react-native-paper";
import { FlatGrid } from "react-native-super-grid";
import { MaterialCommunityIcons, SimpleLineIcons } from "@expo/vector-icons";

import { AuthContext } from "../../context/AuthProvider";
import Loader from "../generate/loader";
import { LanguageContext } from "../Language";
import axiosInstance from "../../apiConfig/apiRequests";
import OrdersDetail from "../OrdersDetail";
import OrdersModal from "../modal/OrdersModalQr";
import OrdersFilters from "./OrdersFilters";
import { useOrderDetails } from "../../hooks/useOrderDetails";

const initialWidth = Dimensions.get("window").width;
const getColumnsByScreenSize = (screenWidth) => {
  if (screenWidth < 600) return 1; // Mobile phones
  if (screenWidth < 960) return 2; // Tablets
  return 3; // Larger screens
};

const initialColumns = getColumnsByScreenSize(initialWidth);
const getCardSize = (width, columns) => width / columns - (columns > 1 ? 15 : 30);

export const OrdersListBase = ({ orderType }) => {
  const [filters, setFilters] = useState({
    orderType: "all",
    orderStatus: "2",
    dateRangeEnd: "",
    dateRangeStart: "",
  });
  const { domain, branchid, user } = useContext(AuthContext);
  const intervalRef = useRef(null);
  const [orders, setOrders] = useState([]);
  const [fees, setFees] = useState([]);
  const [currency, setCurrency] = useState("");
  const [options, setOptions] = useState({
    url_getOrdersLogs: "",
    url_checkOrderStatus: "",
  });

  // Use the custom hook for order details management
  const {
    orderDetails,
    loadingDetails,
    fetchBatchOrderDetails,
    clearOrderDetails,
    getOrderDetails,
    isOrderDetailsLoaded,
    isOrderLoading
  } = useOrderDetails();

  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false);
  const [isOpen, setOpenState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [loadingMore, setLoadingMore] = useState(false); // For infinite scroll
  const [hasMore, setHasMore] = useState(true); // To check if more data is available

  const [width, setWidth] = useState(Dimensions.get('window').width);
  const [numColumns, setNumColumns] = useState(getColumnsByScreenSize(width));
  const [cardSize, setCardSize] = useState(getCardSize(width, numColumns));

  const { dictionary, languageId } = useContext(LanguageContext);

  // FIXED: Memoize toggleContent to prevent unnecessary re-renders
  const toggleContent = useCallback((value) => {
    setOpenState(prev => {
      if (prev.includes(value)) {
        return prev.filter((i) => i !== value);
      } else {
        return [...prev, value];
      }
    });
  }, []);

  const apiOptions = useCallback(() => {
    setOptions({
      url_getOrdersLogs: `https://${domain}/api/v1/admin/getOrderLogs`,
      url_checkOrderStatus: `https://${domain}/api/v1/admin/checkOrderStatus`,
    });
    setOptionsIsLoaded(true);
  }, [domain]);

  const handleApplyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setOrders([]);
    setHasMore(true);
    fetchAcceptedOrders(newFilters, true);
  }, []);

  const fetchAcceptedOrders = async (appliedFilters = filters, reset = false) => {
    if (!user || !options.url_getOrdersLogs) return;

    // Clear previous order details when fetching new orders (only on reset)
    if (reset) clearOrderDetails();

    try {
      if (!reset) setLoadingMore(true); // Show loader for infinite scroll

      const requestFilters = {
        status: { exact: appliedFilters.orderStatus },
        type: { exact: orderType.toString() },
        branchid: { exact: branchid.toString() },
      };

      if (appliedFilters.startDate) {
        const startDate = new Date(appliedFilters.startDate);
        startDate.setHours(0, 0, 0, 0);

        const endDate = appliedFilters.endDate
          ? new Date(appliedFilters.endDate)
          : new Date(appliedFilters.startDate);

        endDate.setHours(23, 59, 59, 999);

        requestFilters.created_at = {
          min: startDate.toISOString().replace('T', ' ').replace('.000Z', ''),
          max: endDate.toISOString().replace('T', ' ').replace('.000Z', '')
        };
      }

      const requestBody = {
        Languageid: languageId,
        Pagination: {
          limit: 12,
          page: reset ? 0 : Math.floor(orders.length / 12)
        },
        Filters: requestFilters
      };

      const resp = await axiosInstance.post(options.url_getOrdersLogs, requestBody);

      const newData = resp.data.data;
      const feesData = resp.data.fees;

      // Filter out duplicates
      const merged = reset ? newData : [...orders, ...newData];
      const uniqueData = Array.from(new Map(merged.map(order => [order.id, order])).values());

      if (uniqueData.length === 0) {
        setHasMore(false);
      } else {
        setOrders(uniqueData);
      }

      // Only fetch details for truly new orders
      const prevOrderIds = new Set(orders.map(order => order.id));
      const newOrderIds = newData
        .map(order => order.id)
        .filter(id => !prevOrderIds.has(id));

      console.log('Fetching details for newOrderIds:', newOrderIds);
      if (newOrderIds.length > 0) {
        // Await until ALL details are loaded before hiding loader
        await fetchBatchOrderDetails(newOrderIds, true, true);
      }

      setFees(feesData);
      setCurrency(resp.data.currency);
    } catch (error) {
      console.log('Error fetching accepted orders:', error);
      const statusCode = error?.status || 'Unknown';
      console.log('Status code accepted orders:', statusCode);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false); // Loader turns off ONLY after details are loaded
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchAcceptedOrders(filters, true);
      return () => { };
    }, [options, branchid, languageId, filters])
  );

  useEffect(() => {
    if (domain && branchid) {
      apiOptions();
    } else if (domain || branchid) {
      setOptionsIsLoaded(false);
      setOrders([]);
    }
  }, [domain, branchid, apiOptions]);

  // Update layout on dimension change
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

  const debounceRef = useRef(null);

  const handleEndReached = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchAcceptedOrders();
    }, 500); // 0.5 წამი
  };

  // FIXED: Memoized component to prevent unnecessary re-renders
  const RenderEnteredOrdersList = React.memo(({ item, toggleContent, isOpen, dictionary, currency, fees }) => {
    const trackLink = [JSON.parse(item.deliveron_data)]?.map(link => {
      return link.trackLink ?? null;
    });
    const additionalFees = parseFloat(item.service_fee) / 100;
    const feeData = JSON.parse(item.fees_details || '{}');
    const feesDetails = fees?.reduce((acc, fee) => {
      const feeId = fee['id'];
      if (feeData[feeId]) {
        acc.push(`${fee['value']} : ${parseFloat(feeData[feeId])}`);
      }
      return acc;
    }, []);

    // FIXED: Get order details and loading state for this specific order
    const orderDetailsData = getOrderDetails(item.id);
    const isOrderDetailsLoading = isOrderLoading(item.id);

    return (
      <View style={{
        width: width / numColumns - (numColumns > 1 ? 15 : 30),
        marginHorizontal: 5
      }}>
        <Card style={styles.card}>
          <TouchableOpacity onPress={() => toggleContent(item.id)}>
            <Card.Content style={styles.head}>
              <Text variant="headlineMedium" style={styles.header}>
                <MaterialCommunityIcons
                  name="music-accidental-sharp"
                  style={styles.leftIcon}
                />
                {item.id}
              </Text>
              <Text style={styles.takeAway}>
                {item.take_away === 1 ? "(" + dictionary["orders.takeAway"] + ")" : ""}
              </Text>
              <Text variant="headlineMedium" style={styles.header}>
                <SimpleLineIcons
                  name={isOpen.includes(item.id) ? "arrow-up" : "arrow-down"}
                  style={styles.rightIcon}
                />
              </Text>
            </Card.Content>
          </TouchableOpacity>

          {!isOpen.includes(item.id) ? (
            <Card.Content>
              <Text variant="titleSmall" style={styles.title}>
                {dictionary["orders.status"]}: {item.status === 2 ? dictionary["filter.prepared"] : dictionary["filter.cancelled"]}
              </Text>
              <Text variant="titleSmall" style={styles.title} numberOfLines={2} ellipsizeMode="tail">
                {dictionary["orders.fName"]}: {item.firstname} {item.lastname}
              </Text>
              <Text variant="titleSmall" style={styles.title}>
                {dictionary["orders.phone"]}: {item.phone_number}
              </Text>
              {trackLink[0] && (
                <TouchableOpacity onPress={() => openURLInBrowser(trackLink[0].toString())}>
                  <Text variant="titleSmall" style={styles.title}>
                    {"Tracking link:"} <Text style={[styles.title, { color: '#3490dc' }]}>{trackLink[0]}</Text>
                  </Text>
                </TouchableOpacity>
              )}
              {item.delivery_scheduled && (
                <Text variant="titleSmall" style={styles.title} numberOfLines={2} ellipsizeMode="tail">
                  {dictionary["orders.scheduledDeliveryTime"]}: {item.delivery_scheduled}
                </Text>
              )}
              {item.comment && (
                <Text variant="titleSmall" style={styles.title} numberOfLines={2} ellipsizeMode="tail">
                  {dictionary["orders.comment"]}: {item.comment}
                </Text>
              )}
              <Text variant="titleSmall" style={styles.title} numberOfLines={2} ellipsizeMode="tail">
                {dictionary["orders.paymentMethod"]}: {item.payment_type}
              </Text>

              <Divider />

              {/* FIXED: Show loading state or content, prevent flickering */}
              {isOrderDetailsLoading ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#0000ff" />
                  <Text style={{ marginTop: 8, color: '#666' }}>Loading order details...</Text>
                </View>
              ) : (
                <OrdersDetail orderId={item.id} orderData={orderDetailsData} />
              )}

              <Divider />

              <Text variant="titleMedium" style={styles.title}>
                {dictionary["orders.initialPrice"]}: {item.real_price} {currency}
              </Text>
              <Text variant="titleMedium" style={styles.title}>
                {dictionary["orders.discountedPrice"]}: {item.price} {currency}
              </Text>
              <Text variant="titleMedium" style={styles.title}>
                {dictionary["orders.table"]}: {item.table_number}
              </Text>
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
            </Card.Content>
          ) : null}
        </Card>
      </View>
    );
  });

  const renderItem = useCallback(({ item }) => {
    return (
      <RenderEnteredOrdersList
        item={item}
        toggleContent={toggleContent}
        isOpen={isOpen}
        dictionary={dictionary}
        currency={currency}
        fees={fees}
      />
    );
  }, [toggleContent, isOpen, dictionary, currency, fees]);

  const getItemLayout = useCallback((data, index) => ({
    length: cardSize,
    offset: cardSize * index,
    index,
  }), [cardSize]);

  // Add detailed logging at the start of the render function
  console.log('loading:', loading, 'loadingMore:', loadingMore, 'loadingDetails:', loadingDetails);
  console.log('orders:', orders.length, 'orderDetails:', Object.keys(orderDetails).length);

  // Add logging in render to show which order IDs are missing details
  const missingDetails = orders.filter(order => !isOrderDetailsLoaded(order.id)).map(order => order.id);
  if (missingDetails.length > 0) {
    console.log('Orders missing details:', missingDetails);
  }

  // Show main loader only for initial load
  if (loading) {
    return <Loader show={true} />;
  }

  return (
    <View style={{ flex: 1, width: "100%" }}>
      {loadingOptions ? <Loader /> : null}

      <View style={{ padding: 10 }}>
        <OrdersFilters onApplyFilters={handleApplyFilters} filters={filters} />
      </View>

      <View style={{ flex: 1, width: "100%" }}>
        <FlatGrid
          key={`flat-grid-${numColumns}`}
          adjustGridToStyles={true}
          itemDimension={cardSize}
          spacing={10}
          data={orders}
          keyExtractor={(item, index) => `${item.id}-${index + 1}`}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          itemContainerStyle={{ justifyContent: 'space-between' }}
          style={{ flex: 1, width: "100%" }}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator size="large" color="#0000ff" /> : null
          }
          removeClippedSubviews={true}
          initialNumToRender={10}
          windowSize={21}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
  },
  filtersContainer: {
    padding: 1,
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
  toggleFiltersButton: {
    backgroundColor: "#3498db",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    margin: 10,
  },
  toggleFiltersButtonText: {
    color: "white",
    fontSize: 16,
  },
});

export const OrdersListQr = () => <OrdersListBase orderType={1} />;
export const OrdersListOnline = () => <OrdersListBase orderType={0} />;
