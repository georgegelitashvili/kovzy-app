import React, { useState, useEffect, useContext } from "react";
import { StyleSheet, View, FlatList, ActivityIndicator } from "react-native";
import { List, Text } from "react-native-paper";
import { Entypo } from "@expo/vector-icons";

import { AuthContext } from "../context/AuthProvider";
import { LanguageContext } from "./Language";
import axiosInstance from "../apiConfig/apiRequests";

export default function OrdersDetail({ orderId }) {
  const [expanded, setExpanded] = useState(true);
  const [orderCart, setOrderCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const { domain } = useContext(AuthContext);
  const { dictionary, userLanguage } = useContext(LanguageContext);

  // Fetch order details on mount or dependency change
  useEffect(() => {
    const fetchData = async () => {
      if (!orderId || !domain) return;

      setLoading(true);
      try {
        const url = `https://${domain}/api/v1/admin/getOrderCart`;
        const response = await axiosInstance.post(url, {
          Orderid: orderId,
          lang: userLanguage,
        });

        const data = response.data.data;

        if (data.message) {
          setOrderCart([]);
        } else {
          setOrderCart(data ?? []);
        }
      } catch (error) {
        console.error("Error fetching order details:", error?.message || error);
        setOrderCart([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId, domain, userLanguage]);

  const handlePress = () => setExpanded(!expanded);

  const renderCustomizables = (customizables) =>
    customizables?.map((cust, idx) => (
      <View key={idx}>
        <Text style={styles.bulletItem}>
          <Text style={styles.bullet}>•</Text>
          {cust.name}:
        </Text>
        {cust.packs.map((pack, pidx) => (
          <View key={pidx} style={styles.nestedBulletItem}>
            <Text style={styles.bullet}>◦</Text>
            <Text style={styles.option}>
              {pack.name} (x{pack.quantity})
            </Text>
          </View>
        ))}
      </View>
    ));

  const renderItem = ({ item, index }) => (
    <View style={styles.body} key={`${item.cart_id}.${index}`}>
      <Text style={styles.header}>
        <Entypo name="dot-single" style={styles.productIcon} />
        {item.name}{" "}
        <Text style={{ fontWeight: "700", fontSize: 20 }}>X{item.amount}</Text>
      </Text>

      {item.type === 1
        ? item.children?.map((child) => (
          <View key={child.id}>
            <Text style={styles.option}>{child.name}:</Text>
            {renderCustomizables(child.customizables)}
          </View>
        ))
        : renderCustomizables(item.customizables)}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!orderCart.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text>{dictionary["orders.noDetails"]}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <List.Section>
        <List.Accordion
          title={dictionary["orders.orderProducts"]}
          expanded={expanded}
          onPress={handlePress}
        >
          <FlatList
            data={orderCart}
            keyExtractor={(item, index) => `${item.cart_id}.${index}`}
            renderItem={renderItem}
          />
        </List.Accordion>
      </List.Section>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  body: {
    padding: 5,
  },
  header: {
    fontWeight: "700",
  },
  option: {
    opacity: 0.6,
    paddingHorizontal: 15,
    fontWeight: "500",
  },
  productIcon: {
    fontSize: 25,
  },
  bulletItem: {
    flexDirection: "row",
    paddingHorizontal: 15,
    marginVertical: 2,
  },
  nestedBulletItem: {
    flexDirection: "row",
    paddingHorizontal: 30,
    marginVertical: 2,
  },
  bullet: {
    fontSize: 18,
    lineHeight: 22,
    marginRight: 5,
  },
});
