import React, { useState, useEffect, useCallback, useContext } from "react";
import { StyleSheet, View } from "react-native";
import { List, Text } from "react-native-paper";
import { Entypo } from "@expo/vector-icons";

import { AuthContext } from "../context/AuthProvider";
import { LanguageContext } from "./Language";
import axiosInstance from "../apiConfig/apiRequests";

export default function OrdersDetail({ orderId }) {
  const [expanded, setExpanded] = useState(true);
  const [orderCart, setOrderCart] = useState([]);
  const { domain } = useContext(AuthContext);
  const [options, setOptions] = useState({});
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false);
  const { dictionary, userLanguage } = useContext(LanguageContext);

  // Set API options based on domain
  const apiOptions = useCallback(() => {
    setOptions({
      url_orderCart: `https://${domain}/api/v1/admin/getOrderCart`,
    });
    setOptionsIsLoaded(true);
  }, [domain]);

  // Fetch order details
  const fetchOrdersDetail = useCallback(async () => {
    if (optionsIsLoaded) {
      try {
        const response = await axiosInstance.post(options.url_orderCart, {
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
        if (error.status === 401) {
          setOptionsIsLoaded(false);
          setOptions({});
          setOrderCart([]);
        }
      }
    }
  }, [options, orderId, userLanguage, optionsIsLoaded]);

  // Load API options and fetch order details
  useEffect(() => {
    apiOptions();
  }, [apiOptions]);

  useEffect(() => {
    fetchOrdersDetail();
  }, [fetchOrdersDetail]);

  // Handle the accordion expand/collapse
  const handlePress = () => setExpanded(!expanded);

  if (!orderCart.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text>{dictionary["orders.noDetails"]}</Text>
      </View>
    );
  }

  return (
    <List.Section>
      <List.Accordion
        title={dictionary["orders.orderProducts"]}
        expanded={expanded}
        onPress={handlePress}
      >
        {orderCart.map((item, index) => (
          <View style={styles.body} key={`${item.cart_id}.${index}`}>
            <Text style={styles.header}>
              <Entypo name="dot-single" style={styles.productIcon} />
              {item.name} <Text style={{ fontWeight: "700", fontSize: 20, }}>X{item.amount}</Text>
            </Text>
            {item.type === 1 ? (
              item.children?.map((child) => (
                <View key={child.id}>
                  <Text style={styles.option}>{child.name}:</Text>
                  {child.customizables.map((cust, idx) => (
                    <View key={idx}>
                      <Text style={styles.bulletItem}>
                        <Text style={styles.bullet}>•</Text>
                        {cust.name}:
                      </Text>
                      {cust.packs.map((pack, pidx) => (
                        <View key={pidx} style={styles.nestedBulletItem}>
                          <Text style={styles.bullet}>◦</Text>
                          <Text style={styles.option}>{pack.name}</Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              ))
            ) : (
              item.customizables?.map((cust, idx) => (
                <View key={idx}>
                  <Text style={styles.bulletItem}>
                    <Text style={styles.bullet}>•</Text>
                    {cust.name}:
                  </Text>
                  {cust.packs.map((pack, pidx) => (
                    <View key={pidx} style={styles.nestedBulletItem}>
                      <Text style={styles.bullet}>◦</Text>
                      <Text style={styles.option}>{pack.name}</Text>
                    </View>
                  ))}
                </View>
              ))
            )}
          </View>
        ))}
      </List.Accordion>
    </List.Section>
  );
}

const styles = StyleSheet.create({
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
