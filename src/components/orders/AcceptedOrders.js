import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import {
  StyleSheet,
  Dimensions,
  View,
  TouchableOpacity,
  Linking,
  Alert,
  RefreshControl,
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

const width = Dimensions.get("window").width;

const numColumns = printRows(width);
const cardSize = width / numColumns;

export const AcceptedOrdersList = () => {
  const { domain, branchid, setUser, user, deleteItem, setIsDataSet, intervalId } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [fees, setFees] = useState([]);
  const [currency, setCurrency] = useState("");

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
  const [numColumns, setNumColumns] = useState(printRows(width));
  const [cardSize, setCardSize] = useState(width / numColumns);

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

  const fetchAcceptedOrders = async () => {
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
    } catch (error) {
      console.log('Error fetching accepted orders full:', error);
      const statusCode = error?.status || 'Unknown';
      console.log('Status code accepted orders:', statusCode);
      clearInterval(intervalId);
    } finally {
      setLoading(false);
    }
  };

  const onChangeModalState = useCallback((newState) => {
    setVisible(newState);
    setIsDeliveronOptions(newState);
    setItemId(null);
    setDeliveron([]);
    setOrders([]);
    fetchAcceptedOrders();
  }, [orders]);

  useEffect(() => {
    if (domain && branchid) {
      apiOptions();
    } else if (domain || branchid) {
      setOptionsIsLoaded(false);
      setOrders([]);
    }
  }, [domain, branchid, apiOptions]);

  useFocusEffect(
    React.useCallback(() => {
      fetchAcceptedOrders();

      return () => { };
    }, [options, page, branchid, languageId])
  );

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

  const RenderEnteredOrdersList = ({ item }) => {
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
    );
  };

  return (
    <View style={styles.container}>
      {loadingOptions && <Loader />}
      {loading && <Loader show={loading} />}
      
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

      <FlatGrid
        itemDimension={cardSize}
        data={orders}
        spacing={10}
        renderItem={({ item }) => <RenderEnteredOrdersList item={item} />}
        keyExtractor={(item) => (item && item.id ? item.id.toString() : '')}
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
});
