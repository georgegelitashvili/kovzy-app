import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  StyleSheet,
  Dimensions,
  View,
  TouchableOpacity,
  Linking,
  Alert,
  FlatList,
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

export const OrdersList = () => {
  const [filters, setFilters] = useState({
    orderType: "all",
    orderStatus: "all",
    dateRangeEnd: "",
    dateRangeStart: "",
    firstName: "",
    lastName: "",
  });
  const { domain, branchid, user, intervalId } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [fees, setFees] = useState([]);
  const [currency, setCurrency] = useState("");
  const [page, setPage] = useState(0);
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
  const [showFilters, setShowFilters] = useState(false); // State to toggle filters visibility

  const { dictionary, languageId } = useContext(LanguageContext);

  const increment = () => { setPage(page + 1); setLoading(true) };
  const decrement = () => { setPage(page - 1); setLoading(true) };

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

  const handleApplyFilters = (newFilters) => {
    console.log("New Filters applied: ", newFilters);
    setFilters(newFilters);
    setPage(0);
    fetchAcceptedOrders(newFilters);
  };

  const fetchAcceptedOrders = async (appliedFilters = filters) => {
    setLoading(true);
    try {
      if (!user || !options.url_getOrdersLogs) {
        return null;
      }

      const requestFilters = {};
      if (appliedFilters.orderStatus !== "all") {
        requestFilters.status = { exact: appliedFilters.orderStatus };
      }
      if (appliedFilters.orderType !== "all") {
        requestFilters.type = { exact: appliedFilters.orderType };
      }
      if (appliedFilters.firstName) {
        requestFilters.firstname = { like: appliedFilters.firstName };
      }
      if (appliedFilters.lastName) {
        requestFilters.lastname = { like: appliedFilters.lastName };
      }
      if (appliedFilters.startDate && appliedFilters.endDate) {
        requestFilters.created_at = { min: appliedFilters.startDate, max: appliedFilters.endDate };
      }

      console.log("Request Filters:", requestFilters);

      const resp = await axiosInstance.post(options.url_getOrdersLogs, JSON.stringify({
        Pagination: {
          limit: 12,
          page: page,
        },
        Filters: requestFilters,
        Languageid: languageId,
        branchid: branchid,
      }));

      const data = resp.data.data;
      const feesData = resp.data.fees;
      setOrders(data);
      setFees(feesData);
      setCurrency(resp.data.currency);
    } catch (error) {
      console.log('Error fetching accepted orders:', error);
      const statusCode = error?.status || 'Unknown';
      console.log('Status code accepted orders:', statusCode);
      clearInterval(intervalId);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchAcceptedOrders(filters);
      return () => { };
    }, [options, page, branchid, languageId, filters])
  );

  useEffect(() => {
    if (domain && branchid) {
      apiOptions();
    } else if (domain || branchid) {
      setOptionsIsLoaded(false);
      setOrders([]);
    }
  }, [domain, branchid, apiOptions]);

  const RenderEnteredOrdersList = ({ item }) => {
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
              {dictionary["orders.status"]}: {dictionary["orders.pending"]}
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
  };

  if (loading) {
    return <Loader show={loading} />;
  }

  return (
    <View style={{ flex: 1, width: "100%" }}>
      {loadingOptions ? <Loader /> : null}
  
      {/* Toggle Filters Button */}
      <TouchableOpacity
        style={styles.toggleFiltersButton}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Text style={styles.toggleFiltersButtonText}>
          {showFilters ? dictionary["nav.hideFilters"] : dictionary["nav.showFilters"]}
        </Text>
      </TouchableOpacity>
  
      {showFilters && (
        <View style={{ flex: 1, width: "100%" }}>
          <OrdersFilters onApplyFilters={handleApplyFilters} filters={filters} />
        </View>
      )}
  
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
          renderItem={({ item }) => <RenderEnteredOrdersList item={item} />}
          keyExtractor={(item) => (item && item.id ? item.id.toString() : '')}
          itemContainerStyle={{ justifyContent: 'space-between' }}
          style={{ flex: 1, width: "100%" }}
          onEndReachedThreshold={0.5}
          removeClippedSubviews={true}
        />
      </View>
  
      {/* Pagination */}
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          onPress={() => {
            decrement();
          }}
          disabled={page === 0}
        >
          <Text
            style={[
              styles.paginationButton,
              page === 0 && styles.paginationButtonDisabled,
            ]}
          >
            {dictionary["prevPage"]}
          </Text>
        </TouchableOpacity>
        <Text style={styles.paginationText}>{page}</Text>
        <TouchableOpacity
          onPress={() => {
            increment();
          }}
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
  title: {
    paddingVertical: 10,
    lineHeight: 24,
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