import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import {
  StyleSheet,
  Dimensions,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Text, Button, Divider, Card } from "react-native-paper";
import { FlatGrid } from "react-native-super-grid";
import {
  MaterialCommunityIcons,
  SimpleLineIcons,
} from "@expo/vector-icons";

import { AuthContext } from "../../context/AuthProvider";

import Loader from "../generate/loader";
import { LanguageContext } from "../Language";
import axiosInstance from "../../apiConfig/apiRequests";
import OrdersDetail from "./OrdersDetail";
import OrdersModal from "../modal/OrdersModal";
import printRows from "../../PrintRows";

const width = Dimensions.get("window").width;

const numColumns = printRows(width);
const cardSize = width / numColumns;

export const AcceptedOrdersList = () => {
  const { domain, branchid, setUser, user, deleteItem, setIsDataSet, intervalId } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
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
  const [credentials, setCredentials] = useState({});
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
      setOrders(data);
    } catch (error) {
      console.log('Error fetching accepted orders full:', error);
      const statusCode = error?.status || 'Unknown';
      console.log('Status code accepted orders:', statusCode);
      if (statusCode === 401) {
        setOrders([]);
        setOptionsIsLoaded(false);
        setOptions({});
        clearInterval(intervalId);
      }
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

  const renderEnteredOrdersList = ({ item }) => {
    const trackLink = [JSON.parse(item.deliveron_data)]?.map(link => {
      return link.trackLink ?? null;
    });

    return (
      <Card key={item.id}>
        <TouchableOpacity onPress={() => toggleContent(item.id)}>
          <Card.Content style={styles.head}>
            <Text variant="headlineMedium" style={styles.header}>
              <MaterialCommunityIcons
                name="music-accidental-sharp"
                style={styles.leftIcon}
              />
              {item.id}
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

            <Text variant="titleSmall" style={styles.title}>
              {dictionary["orders.fName"]}: {item.firstname} {item.lastname}
            </Text>

            <Text variant="titleSmall" style={styles.title}>
              {dictionary["orders.phone"]}: {item.phone_number}
            </Text>

            <Text variant="titleSmall" style={styles.title}>
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
              <Text variant="titleSmall" style={styles.title}>
                {dictionary["orders.scheduledDeliveryTime"]}: {item.delivery_scheduled}
              </Text>
            ) : null}

            {item.comment ? (
              <Text variant="titleSmall" style={styles.title}>
                {dictionary["orders.comment"]}: {item.comment}
              </Text>
            ) : null}

            <Text variant="titleSmall" style={styles.title}>
              {dictionary["orders.paymentMethod"]}: {item.payment_type}
            </Text>

            <Divider />
            <OrdersDetail orderId={item.id} />
            <Divider />

            <Text variant="titleLarge">{item.price} GEL</Text>

            <Card.Actions>
              <Button
                textColor="white"
                buttonColor="#2fa360"
                onPress={() => {
                  setItemId(item.id);
                  showModal("status");
                }}
              >
                {dictionary["orders.finish"]}
              </Button>
              <Button
                textColor="white"
                buttonColor="#f14c4c"
                onPress={() => {
                  setItemId(item.id);
                  showModal("reject");
                }}
              >
                {dictionary["orders.reject"]}
              </Button>
            </Card.Actions>
          </Card.Content>
        ) : null}
      </Card>
    );
  };



  if (loading) {
    return <Loader show={loading} />;
  }

  return (
    <View style={{ flex: 1 }}>
      {loadingOptions ? <Loader /> : null}
      <ScrollView horizontal={true} showsVerticalScrollIndicator={false}>
        {visible ? (
          <OrdersModal
            isVisible={visible}
            onChangeState={onChangeModalState}
            orders={orders}
            hasItemId={itemId}
            deliveron={deliveron}
            deliveronOptions={deliveronOptions}
            type={modalType}
            options={options}
          />
        ) : null}
        <FlatGrid
          itemDimension={cardSize}
          data={orders}
          renderItem={renderEnteredOrdersList}
          adjustGridToStyles={true}
          contentContainerStyle={{ justifyContent: "flex-start" }}
          keyExtractor={(item) => (item && item.id ? item.id.toString() : '')}
        />
      </ScrollView>
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
            Prev
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
            Next
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
    backgroundColor: "#fff",
    justifyContent: "flex-start",
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
});