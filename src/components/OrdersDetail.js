import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { StyleSheet, View, FlatList, ActivityIndicator } from "react-native";
import { List, Text, Button } from "react-native-paper";
import { Entypo } from "@expo/vector-icons";

import { AuthContext } from "../context/AuthProvider";
import { LanguageContext } from "./Language";
import axiosInstance from "../apiConfig/apiRequests";

function OrdersDetail({ orderId, onDataLoaded }) {
  const [expanded, setExpanded] = useState(true);
  const [orderCart, setOrderCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);
  const prevOrderIdRef = useRef(null);
  const hasDataRef = useRef(false);

  const { domain } = useContext(AuthContext);
  const { dictionary, userLanguage } = useContext(LanguageContext);

  const fetchOrderCart = useCallback(async () => {
    if (!orderId || !domain) return;

    // თავიდან ავირიდოთ დუბლირებული fetch
    if (orderId === prevOrderIdRef.current && hasDataRef.current) return;
    
    // განახლება orderId-ის შეცვლისას
    if (orderId !== prevOrderIdRef.current) {
      prevOrderIdRef.current = orderId;
      hasDataRef.current = false;
      setOrderCart([]);
      setError(null);
    }

    // წინა მოთხოვნის გაუქმება
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const url = `https://${domain}/api/v1/admin/getOrderCart`;

      const response = await axiosInstance.post(
        url,
        { Orderid: orderId, lang: userLanguage },
        {
          timeout: 10000,
          signal: abortControllerRef.current.signal,
        }
      );

      const data = response.data.data;
      if (data?.message) {
        setOrderCart([]);
        hasDataRef.current = true;
        onDataLoaded?.(orderId, []);
      } else {
        const cartData = data ?? [];
        setOrderCart(cartData);
        hasDataRef.current = true;
        onDataLoaded?.(orderId, cartData);
      }
    } catch (err) {
      if (err.name !== "AbortError" && err.name !== "CanceledError") {
        console.error("Error fetching order details:", err?.message || err);
        setError(dictionary["errors.apiError"] || "Failed to load order details.");
        setOrderCart([]);
        hasDataRef.current = false;
      }
    } finally {
      setLoading(false);
    }
  }, [orderId, domain, userLanguage, dictionary]);

  useEffect(() => {
    // Reset state when orderId changes
    if (orderId !== prevOrderIdRef.current) {
      hasDataRef.current = false;
      setOrderCart([]);
      setError(null);
      setLoading(false);
    }
    
    fetchOrderCart();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [fetchOrderCart, orderId]);

  const handleRetry = useCallback(() => {
    hasDataRef.current = false;
    fetchOrderCart();
  }, [fetchOrderCart]);

  const handlePress = useCallback(() => setExpanded((prev) => !prev), []);

  const renderCustomizables = useCallback(
    (customizables) =>
      customizables?.map((cust, idx) => (
        <View key={`customizable-${idx}`}>
          <Text style={styles.bulletItem}>
            <Text style={styles.bullet}>•</Text>
            {cust.name}:
          </Text>
          {cust.packs?.map((pack, pidx) => (
            <View key={`pack-${idx}-${pidx}`} style={styles.nestedBulletItem}>
              <Text style={styles.bullet}>◦</Text>
              <Text style={styles.option}>
                {pack.name} (x{pack.quantity})
              </Text>
            </View>
          ))}
        </View>
      )),
    []
  );

  const renderItem = useCallback(
    ({ item, index }) => (
      <View style={styles.body} key={`${item.cart_id}.${index}`}>
        <Text style={styles.header}>
          <Entypo name="dot-single" style={styles.productIcon} />
          {item.name}{" "}
          <Text style={{ fontWeight: "700", fontSize: 20 }}>X{item.amount}</Text>
        </Text>

        {item.type === 1
          ? item.children?.map((child) => (
            <View key={`child-${child.id}`}>
              <Text style={styles.option}>{child.name}:</Text>
              {renderCustomizables(child.customizables)}
            </View>
          ))
          : renderCustomizables(item.customizables)}
      </View>
    ),
    [renderCustomizables]
  );

  const keyExtractor = useCallback(
    (item, index) => `${item.cart_id}.${index}`,
    []
  );

  const emptyStateText = useMemo(
    () => dictionary["orders.noDetails"] || "No order details available",
    [dictionary]
  );

  const retryButtonText = useMemo(
    () => dictionary["buttons.retry"] || "Retry",
    [dictionary]
  );

  const accordionTitle = useMemo(
    () => dictionary["orders.orderProducts"] || "Order Products",
    [dictionary]
  );

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={handleRetry} style={styles.retryButton}>
          {retryButtonText}
        </Button>
      </View>
    );
  }

  if (!orderCart.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyStateText}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <List.Section>
        <List.Accordion
          title={accordionTitle}
          expanded={expanded}
          onPress={handlePress}
        >
          <FlatList
            data={orderCart}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        </List.Accordion>
      </List.Section>
    </View>
  );
}

// ✅ Enhanced memo wrapping with deeper comparison
export default React.memo(OrdersDetail, (prevProps, nextProps) => {
  // Only re-render if orderId actually changes
  return prevProps.orderId === nextProps.orderId;
});

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
  errorText: {
    color: "#d32f2f",
    textAlign: "center",
    marginBottom: 10,
  },
  emptyText: {
    color: "#666",
    textAlign: "center",
    fontSize: 16,
  },
  retryButton: {
    marginTop: 10,
  },
});
