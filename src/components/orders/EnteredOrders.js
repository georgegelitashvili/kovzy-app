import React, { useState, useEffect, useCallback, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  StyleSheet,
  Dimensions,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator
} from "react-native";
import { Text, Button, Divider, Card } from "react-native-paper";
import { FlatGrid } from "react-native-super-grid";
import {
  MaterialCommunityIcons,
  FontAwesome,
  SimpleLineIcons,
} from "@expo/vector-icons";
import { Audio } from "expo-av";

import { AuthContext, AuthProvider } from '../../context/AuthProvider';
import { storeData, getData, getMultipleData } from "../../helpers/storage";
import Loader from "../generate/loader";
import { String, LanguageContext } from "../Language";
import { Request } from "../../axios/apiRequests";
import OrdersDetail from "./OrdersDetail";
import OrdersModal from "../modal/OrdersModal";
import printRows from "../../PrintRows";
import { PrivateValueStore } from "@react-navigation/native";

const width = Dimensions.get("window").width;

const numColumns = printRows(width);
const cardSize = width / numColumns;

let ordersCount;
let temp = 0;

// render entered orders function
export const EnteredOrdersList = (auth) => {
  const [orders, setOrders] = useState([]);
  const { domain, branchid } = useContext(AuthContext);

  const [domainIsLoaded, setDomainIsLoaded] = useState(false);

  const [options, setOptions] = useState({}); // api options
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false); // api options
  const [deliveronOptions, setDeliveronOptions] = useState({});
  const [isDeliveronOptions, setIsDeliveronOptions] = useState(false);
  const [acceptOrderOptions, setAcceptOrderOptions] = useState({});
  const [rejectOrderOptions, setRejectOrderOptions] = useState({});

  const [deliveron, setDeliveron] = useState([]);
  const [visible, setVisible] = useState(false); // modal state
  const [itemId, setItemId] = useState(null); //item id for modal
  const [isOpen, setOpenState] = useState([]); // my accordion state
  const [lang, setLang] = useState("");
  const [modalType, setModalType] = useState("");
  const [sound, setSound] = useState(new Audio.Sound());

  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const { dictionary } = useContext(LanguageContext);

  const onChangeModalState = (newState) => {
    setTimeout(() => {
      setVisible(newState);
      setIsDeliveronOptions(newState);
      setItemId(null);
      setDeliveron([]);
    }, 0);
  };

  const toggleContent = (value) => {
    setOpenState([...isOpen, value]);

    let index = isOpen.indexOf(value);
    if (index > -1) setOpenState([...isOpen.filter((i) => i !== value)]);
  };

  const onStopPlaySound = async () => {
    sound.stopAsync();
  }

  const onPlaySound = async () => {
    const source = require("../../assets/audio/alert.mp3");
    try {
      await sound.loadAsync(source);
      await sound.playAsync().then(async PlaybackStatus => {
        setTimeout(() => {
          sound.unloadAsync();
        }, PlaybackStatus.playableDurationMillis)
      }).catch(error => {
        console.log(error)
      })
    } catch (error) {
      console.log(error)
    }
  }

  const orderReceived = () => {
    Alert.alert("ALERT", "***New Order Received***", [
      {text: 'OK', onPress: () => onStopPlaySound()},
    ]);
  }

  const getOrders = () => {
    setOptions({
      method: "POST",
      data: {
        type: 0,
        page: 1,
        branchid: branchid,
      },
      url: `https://${domain}/api/getUnansweredOrders`,
    });
    setOptionsIsLoaded(true);
  };

  const readDataDeliveron = () => {
    setDeliveronOptions({
      method: "POST",
      url: `https://${domain}/api/deliveronRecheck`,
    });
  };

  const readDataAcceptOrder = () => {
    setAcceptOrderOptions({
      method: "POST",
      url: `https://${domain}/api/acceptOrder`,
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
    if(domain && branchid) {
      getOrders();
      readDataDeliveron();
      readDataAcceptOrder();
      readDataRejectOrder();
    }else if(domain || branchid) {
      setOptionsIsLoaded(false);
      setOrders([]);
    }
  }, [domain, branchid])


  useEffect(() => {
      const interval = setInterval(() => {
        if (optionsIsLoaded) {
          console.log(options);
          Request(options).then((resp) => {setOrders(resp);});
          setLoading(false);
        }
      }, 5000);

      return () => {
        clearInterval(interval);
      };
  }, [optionsIsLoaded]);


  useEffect(() => {
    if (itemId) {
      setDeliveronOptions((prev) => ({ ...prev, data: { orderId: itemId } }));
      setIsDeliveronOptions(true);
      setLoadingOptions(true);
    }
  }, [itemId]);


  useEffect(() => {
    if (isDeliveronOptions) {
      Request(deliveronOptions).then((resp) => setDeliveron(resp));
    }
  }, [isDeliveronOptions]);

  useEffect(() => {
    if(deliveron) {
      setLoadingOptions(false);
    }
  },[deliveron])


  useEffect(() => {
    ordersCount = Object.keys(orders).length;
    if(ordersCount > temp) {
      onPlaySound();
      orderReceived();
    }
    temp = ordersCount;
  }, [orders])


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
                  showModal('accept');
                }}
              >
                {dictionary["orders.accept"]}
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

  if(loading) {
    return (<Loader />)
  }

  console.log('------------ entered orders');
  console.log(orders);
  console.log(branchid);
  console.log(optionsIsLoaded);
  console.log('------------ end entered orders');

  // console.log(orders);

  return (
    <View style={{flex: 1}}>
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
