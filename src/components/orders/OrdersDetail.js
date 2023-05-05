import React, { useState, useEffect, useContext } from "react";
import { StyleSheet, View } from "react-native";
import { List, Text } from "react-native-paper";

import { AuthContext, AuthProvider } from "../../context/AuthProvider";
import { String, LanguageContext } from "../Language";
import axiosInstance from "../../apiConfig/apiRequests";

export default function OrdersDetail({ orderId }) {
  const [expanded, setExpanded] = useState(true);
  const handlePress = () => setExpanded(!expanded);

  const [orderCart, setOrderCart] = useState([]);
  const { setIsDataSet, domain, setDomain, branchid, setUser } =
    useContext(AuthContext);

  const [options, setOptions] = useState({}); // api options
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false); // api options

  const { dictionary, userLanguage } = useContext(LanguageContext);

  const apiOptions = () => {
    setOptions({
      url_orderCart: `https://${domain}/api/getOrderCart`,
    });
    setOptionsIsLoaded(true);
  };

  useEffect(() => {
    apiOptions();
    if (optionsIsLoaded) {
      axiosInstance
        .post(options.url_orderCart, {
          Orderid: orderId,
          lang: userLanguage,
        })
        .then((resp) => setOrderCart(resp.data.data))
        .catch((error) => {
          if(error) {
            setOrderCart([]);
            setIsDataSet(false);
          }
        });
    }
  }, [optionsIsLoaded, userLanguage, orderId]);

  if (orderCart?.length == 0) {
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
                ?.map((child) => {
                  return `${child.name}: ${child.customizables.map((cust) => {
                    return `${cust.name}: ${cust.packs
                      ?.map((e) => e.name)
                      .join(", ")}`;
                  })}; `;
                })
                .join("");
            } else if (item.type == 0) {
              optionsMarkup = item.customizables
                ?.map((cust) => {
                  return `${cust.name}: ${cust.packs
                    ?.map((e) => e.name)
                    .join(", ")}; `;
                })
                .join("");
            }

            return (
              <View style={styles.body} key={item.cart_id + "." + index}>
                <Text style={styles.header}>
                  {index + 1 + "."} {item.name}
                </Text>
                <Text style={styles.option}>
                  {dictionary["amount"]}: {item.amount}
                </Text>
                {optionsMarkup ? (
                  <Text style={styles.option}>Options:({optionsMarkup})</Text>
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
});
