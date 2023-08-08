import React, { useState, useEffect, useCallback, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  StyleSheet,
  Dimensions,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Text, Button, Divider, Card } from "react-native-paper";
import { FlatGrid } from "react-native-super-grid";
import {
  MaterialCommunityIcons,
  FontAwesome,
  SimpleLineIcons,
} from "@expo/vector-icons";

import { AuthContext, AuthProvider } from "../../context/AuthProvider";
import { storeData, getData, getMultipleData } from "../../helpers/storage";
import Loader from "../generate/loader";
import { String, LanguageContext } from "../Language";
import axiosInstance from "../../apiConfig/apiRequests";
import OrdersDetail from "./OrdersDetail";
import OrdersModal from "../modal/OrdersModal";
import printRows from "../../PrintRows";

const width = Dimensions.get("window").width;

const numColumns = printRows(width);
const cardSize = width / numColumns;

// render accepted orders function
export const AcceptedOrdersList = () => {
  const { setIsDataSet, domain, setDomain, branchid, setUser } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);

  const [page, setPage] = useState(0);

  const [options, setOptions] = useState({}); // api options
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false); // api options
  const [deliveronOptions, setDeliveronOptions] = useState({});
  const [isDeliveronOptions, setIsDeliveronOptions] = useState(false);

  const [deliveron, setDeliveron] = useState([]);
  const [visible, setVisible] = useState(false); // modal state
  const [itemId, setItemId] = useState(null); //item id for modal
  const [isOpen, setOpenState] = useState([]); // my accordion state
  const [modalType, setModalType] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const { dictionary, userLanguage } = useContext(LanguageContext);

  const increment = () => {setPage(c => c + 1);setLoading(true)};
  const decrement = () => {setPage(c => c - 1);setLoading(true)};

  const onChangeModalState = useCallback((newState) => {
    setTimeout(() => {
      setVisible(newState);
      setIsDeliveronOptions(newState);
      setItemId(null);
      setDeliveron([]);
    }, 0);
  });

  const toggleContent = useCallback((value) => {
    setOpenState([...isOpen, value]);

    let index = isOpen.indexOf(value);
    if (index > -1) setOpenState([...isOpen.filter((i) => i !== value)]);
  });

  const apiOptions = () => {
    setOptions({
      url_getAcceptedOrders: `https://${domain}/api/v1/admin/getAcceptedOrders`,
      url_deliveronStatus: `https://${domain}/api/v1/admin/deliveronStatus`,
      url_checkOrderStatus: `https://${domain}/api/v1/admin/checkOrderStatus`,
      url_orderPrepared: `https://${domain}/api/v1/admin/orderPrepared`,
      url_rejectOrder: `https://${domain}/api/v1/admin/rejectOrder`,
    });
    setOptionsIsLoaded(true);
  };

  // modal show
  const showModal = (type) => {
    setModalType(type);
    setVisible(true);
  };

  useEffect(() => {
    if (domain && branchid) {
      apiOptions();
    } else if (domain || branchid) {
      setOptionsIsLoaded(false);
      setOrders([]);
    }
  }, [domain, branchid]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (optionsIsLoaded || page) {
        axiosInstance
          .post(options.url_getAcceptedOrders, JSON.stringify({
            Pagination: {
              limit: 12,
              page: page
            },
            branchid: branchid,
            type: 0
          }))
          .then((resp) => {
            setOrders(resp.data.data);
          })
          .catch((error) => {
            if (error) {
              console.log("----------------- accepted orders error");
              console.log(error);
              console.log("----------------- end accepted orders error");
              setOrders([]);
              setIsDataSet(false);
            }
          });
        setLoading(false);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [optionsIsLoaded, page]);


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

  const renderEnteredOrdersList = ({ item }) => {
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
    return <Loader />;
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
          data={orders || []}
          renderItem={renderEnteredOrdersList}
          adjustGridToStyles={true}
          contentContainerStyle={{ justifyContent: "flex-start" }}
          keyExtractor={(item) => item.id.toString()}
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
    flex: 12,
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
