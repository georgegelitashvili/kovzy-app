import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import { Text, Card, Button, Divider } from "react-native-paper";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome,
} from "@expo/vector-icons";

import { getOrders } from "../../redux/Actions";
import OrdersDetail from "./OrdersDetail";
import OrdersModal from "../modal/OrdersModal";


const screenHeight = Dimensions.get("window").height;
const screenWidth = Dimensions.get("window").width;
const numColumns = 4;
const tileSize = screenWidth / numColumns


// render entered orders function
export const EnteredOrdersList = () => {

  const { orders } = useSelector((state) => state.ordersReducer);
  const [visible, setVisible] = useState(false); // modal state

  // modal show
  const showModal = () => setVisible(true);

  const onChangeModalState = (newState) => {
    setTimeout(() => setVisible(newState), 0);
  };

  const dispatch = useDispatch();
  const fetchOrders = () => dispatch(getOrders());

  useEffect(() => {
    fetchOrders();
    // const interval = setInterval(() => {
    //   fetchOrders();
    // }, 500);

    // return () => {
    //   clearInterval(interval)
    // }
  }, []);


  const renderEnteredOrdersList = ({ item }) => {
    return (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.header}>
              <MaterialCommunityIcons
                name="music-accidental-sharp"
                style={styles.leftIcon}
              />
              {item.id}
            </Text>
          </Card.Content>
          <Card.Content>
            <Text variant="titleMedium">{item.title}</Text>
          </Card.Content>
          <Divider />
          {/* accordion */}
          <OrdersDetail ordersDetail={item} />
          <Divider />
          <Card.Content>
            <Text variant="titleLarge">
              {item.price} <FontAwesome name="dollar" size={20} />
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button onPress={showModal}>accept</Button>
            <Button>cancel</Button>
          </Card.Actions>
        </Card>
    );
  };



  return (
      <View style={styles.container}>
      {visible ? <OrdersModal isVisible={visible} onChangeState={onChangeModalState}/> : null}
      <FlatList
          data={orders}
          renderItem={renderEnteredOrdersList}
          keyExtractor={(item) => item.id.toString()}
          initialNumToRender={5}
          ItemSeparatorComponent={() => <View style={{height: 3}} />}
      />
      </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "space-between",
    justifyContent: "space-between",
  },
  card: {
    flex: 0.5,
    with: tileSize,
    backgroundColor: "#fff",

    margin: 20,
    paddingVertical: 18,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowColor: "#14141405",
        shadowOpacity: 0.8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    paddingVertical: 0,
  },
  leftIcon: {
    marginRight: 3,
    fontSize: 32,
  },
});