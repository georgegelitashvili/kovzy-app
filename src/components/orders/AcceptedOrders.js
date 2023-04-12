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

import { storeData, getData, getMultipleData } from "../../helpers/storage";
import Loader from "../generate/loader";
import { String, LanguageContext } from "../Language";
import { Request } from "../../axios/apiRequests";
import OrdersDetail from "./OrdersDetail";
import OrdersModal from "../modal/OrdersModal";
import printRows from "../../PrintRows";

const width = Dimensions.get("window").width;

const numColumns = printRows(width);
const cardSize = width / numColumns;

// render accepted orders function
export const AcceptedOrdersList = (auth) => {
  const [orders, setOrders] = useState([]);

  const [domain, setDomain] = useState(null);
  const [branchid, setBranchid] = useState(null);
  const [domainIsLoaded, setDomainIsLoaded] = useState(false);

  const [options, setOptions] = useState({}); // api options
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false); // api options
  const [deliveronOptions, setDeliveronOptions] = useState({});
  const [deliveronStatus, setDeliveronStatus] = useState({});
  const [isDeliveronOptions, setIsDeliveronOptions] = useState(false);
  const [acceptOrderOptions, setAcceptOrderOptions] = useState({});
  const [rejectOrderOptions, setRejectOrderOptions] = useState({});
  const [deliveronData, setDeliveronData] = useState({});

  const [deliveron, setDeliveron] = useState([]);
  const [visible, setVisible] = useState(false); // modal state
  const [itemId, setItemId] = useState(null); //item id for modal
  const [isOpen, setOpenState] = useState([]); // my accordion state
  const [lang, setLang] = useState("");
  const [modalType, setModalType] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const { dictionary } = useContext(LanguageContext);

  const readData = async () => {
    await getMultipleData(["domain", "branch"]).then((data) => {
      let domain = [JSON.parse(data[0][1])].map((e) => e.value);
      let branchid = data[1][1];

      setDomain(domain[0]);
      setBranchid(branchid);
      setDomainIsLoaded(true);
    });
  }

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

  const getOrders = () => {
    setOptions({
      method: "POST",
      data: {
        type: 0,
        page: 1,
        branchid: branchid,
      },
      url: `https://${domain}/api/getAcceptedOrders`,
    });
    setOptionsIsLoaded(true);
  };

  const readDeliveronStatus = (endPoint) => {
    setDeliveronStatus({
      method: "POST",
      url: `https://${domain}/api/deliveronStatus`
    });
  };

  const readDataDeliveron = () => {
    setDeliveronOptions({
      method: "POST",
      url: `https://${domain}/api/checkOrderStatus`,
    });
  };

  const readDataPreparedOrder = () => {
    setAcceptOrderOptions({
      method: "POST",
      url: `https://${domain}/api/orderPrepared`,
    });
  };

  const readDataRejectOrder = () => {
    setRejectOrderOptions({
      method: "POST",
      url: `https://${domain}/api/rejectOrder`,
    });
  };

  // modal show
  const showModal = (type) => {
    setModalType(type);
    setVisible(true);
  };

  getData("rcml-lang").then((lang) => setLang(lang || "ka"));

  useEffect(() => {
    readData();
  });

  useEffect(() => {
    if(domainIsLoaded) {
      getOrders();
      readDeliveronStatus();
      readDataDeliveron();
      readDataPreparedOrder();
      readDataRejectOrder();
    }
  }, [domainIsLoaded])

  useEffect(() => {
    if(branchid || domain) {
      setOptionsIsLoaded(false);
      setDomainIsLoaded(false);
      setOrders([]);
    }
  }, [branchid, domain])

  useEffect(() => {
    if(auth === true) {
      const interval = setInterval(() => {
        if (optionsIsLoaded) {
          Request(options).then((resp) => setOrders(resp));
        }
      }, 5000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [optionsIsLoaded, auth]);


  useEffect(() => {
    if (itemId) {
      setDeliveronStatus({ ...deliveronStatus });
      setIsDeliveronOptions(true);
      setLoadingOptions(true);
    }
  }, [itemId]);

  useEffect(() => {
    if(deliveron) {
      setLoadingOptions(false);
    }
  },[deliveron])


  useEffect(() => {
    if (isDeliveronOptions) {
      Request(deliveronStatus).then((resp) => setDeliveron(resp));
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
            <OrdersDetail orderId={item.id} lang={lang} />
            <Divider />

            <Text variant="titleLarge">{item.price} GEL</Text>

            <Card.Actions>
              <Button
                textColor="white"
                buttonColor="#2fa360"
                onPress={() => {
                  setItemId(item.id);
                  showModal('status');
                }}
              >
                {dictionary["orders.finish"]}
              </Button>
              <Button textColor="white" buttonColor="#f14c4c" onPress={() => {
                  setItemId(item.id);
                  showModal('reject');
                }}>
                {dictionary["orders.reject"]}
              </Button>
            </Card.Actions>
          </Card.Content>
        ) : null}
      </Card>
    );
  };

  if (orders?.length == 0 || orders == null) {
    return null;
  }

  return (
    <View style={{flex: 1}}>
      {loadingOptions ? <Loader text="Loading options"/> : null}
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
            accept={acceptOrderOptions}
            reject={rejectOrderOptions}
          />
        ) : null}
        <FlatGrid
          itemDimension={cardSize}
          data={orders || []}
          renderItem={renderEnteredOrdersList}
          adjustGridToStyles={true}
          contentContainerStyle={{ justifyContent: "flex-start" }}
          keyExtractor={(item) => item.id}
        />
      </ScrollView>
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
});
