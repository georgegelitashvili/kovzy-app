import React, { useState, useEffect, useCallback, useContext, useRef, memo } from "react";
import {
  StyleSheet,
  Dimensions,
  View,
  TouchableOpacity,
  ActivityIndicator,
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
import printRows from "../../PrintRows";
import OrdersFilters from "./OrdersFilters";

const width = Dimensions.get("window").width;
const numColumns = printRows(width);
const cardSize = width / numColumns;

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
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  const [itemId, setItemId] = useState(null);
  const [isOpen, setOpenState] = useState([]);
  const [modalType, setModalType] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [loadingMore, setLoadingMore] = useState(false); // For infinite scroll
  const [hasMore, setHasMore] = useState(true); // To check if more data is available

  const { dictionary, languageId } = useContext(LanguageContext);

  const toggleContent = useCallback((value) => {
    if (isOpen.includes(value)) {
      setOpenState(isOpen.filter((i) => i !== value));
    } else {
      setOpenState([...isOpen, value]);
    }
  }, [isOpen]);

  const apiOptions = useCallback(() => {
    setOptions({
      url_getOrdersLogs: `https://${domain}/api/v1/admin/getOrderLogs`,
      url_checkOrderStatus: `https://${domain}/api/v1/admin/checkOrderStatus`,
    });
    setOptionsIsLoaded(true);
  }, [domain]);

  const handleApplyFilters = useCallback((newFilters) => {
    console.log("New Filters applied: ", newFilters);
    setFilters(newFilters);
    setOrders([]);
    setHasMore(true);
    fetchAcceptedOrders(newFilters, true);
  }, []);

  const fetchAcceptedOrders = async (appliedFilters = filters, reset = false) => {
    if (!user || !options.url_getOrdersLogs) return;

    try {
      const resp = await axiosInstance.post(options.url_getOrdersLogs, {
        ...appliedFilters,
        branchid: branchid,
        Languageid: languageId,
        page: reset ? 0 : Math.floor(orders.length / 12),
      });

      const newData = resp.data.data;
      const feesData = resp.data.fees;

      // Filter out duplicates
      const uniqueData = newData.filter(
        (order) => !orders.some((existingOrder) => existingOrder.id === order.id)
      );

      if (uniqueData.length === 0) {
        setHasMore(false);
      } else {
        setOrders((prevOrders) => reset ? uniqueData : [...prevOrders, ...uniqueData]);
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
      setLoadingMore(false);
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

  const RenderEnteredOrdersList = memo(({ item, toggleContent, isOpen, dictionary, currency, fees }) => {
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
            <Text style={styles.takeAway}>
              {item.take_away === 1 ? "(" + dictionary["orders.takeAway"] + ")" : ""}
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
            <OrdersDetail orderId={item.id} />
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

  if (loading) {
    return <Loader show={loading} />;
  }

  return (
    <View style={{ flex: 1, width: "100%" }}>
      {loadingOptions ? <Loader /> : null}

      <View style={{ padding: 10 }}>
        <OrdersFilters onApplyFilters={handleApplyFilters} filters={filters} />
      </View>

      <View style={{ flex: 1, width: "100%" }}>
        {visible ? (
          <OrdersModal
            isVisible={visible}
            onChangeState={() => setVisible(false)}
            orders={orders}
            hasItemId={itemId}
            type={modalType}
            options={options}
            PendingOrders={false}
          />
        ) : null}

        <FlatGrid
          adjustGridToStyles={true}
          itemDimension={cardSize}
          spacing={10}
          data={orders}
          keyExtractor={(item) => `${item.id}-${item.created_at}`} 
          renderItem={renderItem}
          itemContainerStyle={{ justifyContent: 'space-between' }}
          style={{ flex: 1, width: "100%" }}
          onEndReached={() => fetchAcceptedOrders()}
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