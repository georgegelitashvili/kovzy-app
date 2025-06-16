import React, { useState, useEffect, useCallback, useContext } from "react";
import { StyleSheet, View } from "react-native";
import { List, Text } from "react-native-paper";
import { Entypo } from "@expo/vector-icons";

import { AuthContext } from "../context/AuthProvider";
import { LanguageContext } from "./Language";
import axiosInstance from "../apiConfig/apiRequests";
import ErrorDisplay from './generate/ErrorDisplay';

// Create a cache to store order details
const orderDetailsCache = new Map();
// Set cache expiry time (5 minutes)
const CACHE_EXPIRY_TIME = 5 * 60 * 1000;

export default function OrdersDetail({ orderId }) {
  const [expanded, setExpanded] = useState(true);
  const [orderCart, setOrderCart] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const { domain } = useContext(AuthContext);
  const [options, setOptions] = useState({});
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false);
  const { dictionary, userLanguage } = useContext(LanguageContext);
  const [error, setError] = useState(null);

  // Set API options based on domain
  const apiOptions = useCallback(() => {
    setOptions({
      url_orderCart: `https://${domain}/api/v1/admin/getOrderCart`,
    });
    setOptionsIsLoaded(true);
  }, [domain]);

  // Check if data is in cache and still valid
  const getFromCache = useCallback((key) => {
    if (orderDetailsCache.has(key)) {
      const { data, timestamp } = orderDetailsCache.get(key);
      const now = Date.now();
      if (now - timestamp < CACHE_EXPIRY_TIME) {
        return data; // Return cached data if still valid
      }
    }
    return null; // No valid cached data
  }, []);

  // Add data to cache
  const addToCache = useCallback((key, data) => {
    orderDetailsCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }, []);

  // Fetch order details
  const fetchOrdersDetail = useCallback(async () => {
    if (!optionsIsLoaded || isFetching) return;
    
    // Create a cache key using orderId and language
    const cacheKey = `${orderId}_${userLanguage}`;
    
    // Check if we have this data in cache
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      setOrderCart(cachedData);
      return;
    }
    
    setIsFetching(true);
    
    try {
      const response = await axiosInstance.post(options.url_orderCart, {
        Orderid: orderId,
        lang: userLanguage,
      });
      const data = response.data.data;

      if (data.message) {
        setOrderCart([]);
      } else {
        const orderData = data ?? [];
        setOrderCart(orderData);
        
        // Cache the results
        addToCache(cacheKey, orderData);
      }
    } catch (error) {
      setError(error);
      if (error.status === 401) {
        setOptionsIsLoaded(false);
        setOptions({});
        setOrderCart([]);
      }
    } finally {
      setIsFetching(false);
    }
  }, [options, orderId, userLanguage, optionsIsLoaded, getFromCache, addToCache, isFetching]);

  // Load API options and fetch order details
  useEffect(() => {
    apiOptions();
  }, [apiOptions]);

  useEffect(() => {
    fetchOrdersDetail();
  }, [fetchOrdersDetail]);

  // Handle the accordion expand/collapse
  const handlePress = () => setExpanded(!expanded);

  // Force refresh function to manually refresh data when needed
  const refreshOrderDetails = useCallback(() => {
    // Remove from cache to force a fresh fetch
    const cacheKey = `${orderId}_${userLanguage}`;
    orderDetailsCache.delete(cacheKey);
    fetchOrdersDetail();
  }, [orderId, userLanguage, fetchOrdersDetail]);

  if (!orderCart.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text>{dictionary["orders.noDetails"]}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* <ErrorDisplay error={error} /> */}
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
                            <Text style={styles.option}>({pack.quantity})</Text>
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
                        <Text style={styles.option}>({pack.quantity})</Text>
                      </View>
                    ))}
                  </View>
                ))
              )}
            </View>
          ))}
        </List.Accordion>
      </List.Section>
    </View>
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
  container: {
    flex: 1,
  },
});
