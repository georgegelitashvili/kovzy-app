import React, { useState, useEffect, useCallback, useContext } from "react";
import { StyleSheet, View } from "react-native";
import { List, Text } from "react-native-paper";
import { Entypo } from "@expo/vector-icons";

import { AuthContext, AuthProvider } from "../../context/AuthProvider";
import { String, LanguageContext } from "../Language";
import axiosInstance from "../../apiConfig/apiRequests";

export default function OrdersDetail({ orderId }) {
  const [expanded, setExpanded] = useState(true);
  const handlePress = () => setExpanded(!expanded);

  const [orderCart, setOrderCart] = useState([]);
  const { domain } = useContext(AuthContext);

  const [options, setOptions] = useState({}); // api options
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false); // api options

  const { dictionary, userLanguage } = useContext(LanguageContext);

  const apiOptions = useCallback(() => {
    setOptions({
      url_orderCart: `https://${domain}/api/v1/admin/getOrderCart`,
    });
    setOptionsIsLoaded(true);
  }, [domain]);

  const fetchOrdersDetail = async () => {
    await axiosInstance
      .post(options.url_orderCart, {
        Orderid: orderId,
        lang: userLanguage,
      })
      .then((resp) => resp.data.data)
      .then((data) => {
        if (data.message) {
          setOrderCart([]);
          return;
        }
        setOrderCart(data ?? []);
      })
      .catch((error) => {
        if (error.status == 401) {
          setOptionsIsLoaded(false);
          setOptions({});
          setOrderCart([]);
        }
      });
  }

  useEffect(() => {
    apiOptions();
    if (optionsIsLoaded) {
      fetchOrdersDetail();
    }
  }, [optionsIsLoaded, userLanguage, orderId]);

  if (!orderCart) {
    return null;
  }

  return (
    <List.Section>
      <List.Accordion
        title={dictionary["orders.orderProducts"]}
        expanded={expanded}
        onPress={handlePress}
      >
        {orderCart?.map((item, index) => {
          if (item.cart_id == orderId) {
            let optionsMarkup = null;

            if (item.type == 1) {
              optionsMarkup = item.children
                ?.map((child) => (
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
                ));
            } else if (item.type == 0) {
              optionsMarkup = item.customizables
                ?.map((cust, idx) => (
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
                ));
            }

            return (
              <View style={styles.body} key={item.cart_id + "." + index}>
                <Text style={styles.header}>
                  <Entypo
                    name="dot-single"
                    style={styles.productIcon}
                  /> {item.name} X{item.amount}
                </Text>
                {optionsMarkup ? (
                  <View>{optionsMarkup}</View>
                ) : (
                  <Text style={styles.option}>Options:()</Text>
                )}
              </View>
            );
          }
        })}
      </List.Accordion>
    </List.Section>
  );
}

const styles = StyleSheet.create({
  accordion: {
    background: "#fff",
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
