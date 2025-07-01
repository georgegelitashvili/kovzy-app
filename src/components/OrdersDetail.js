import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { StyleSheet, View, FlatList } from "react-native";
import { List, Text } from "react-native-paper";
import { Entypo } from "@expo/vector-icons";

import { LanguageContext } from "./Language";

/**
 * OrdersDetail Component
 * 
 * Displays order details using pre-fetched data from parent component.
 * No longer makes individual API calls - expects orderData to be provided.
 * 
 * @param {string|number} orderId - The order ID to display details for
 * @param {Array} orderData - Pre-fetched order data from parent component
 * @param {Function} onDataLoaded - Optional callback when data is loaded
 */
function OrdersDetail({ orderId, orderData, onDataLoaded }) {
  // console.log("OrdersDetail rendered with orderId:", orderData);
  const [expanded, setExpanded] = useState(true);
  const [orderCart, setOrderCart] = useState([]);

  const { dictionary } = useContext(LanguageContext);

  useEffect(() => {
    // Use the pre-fetched orderData directly
    if (orderData !== undefined) {
      setOrderCart(orderData || []);
      onDataLoaded?.(orderId, orderData || []);
    } else {
      // If no data provided, set empty array
      setOrderCart([]);
      onDataLoaded?.(orderId, []);
    }
  }, [orderId, orderData, onDataLoaded]);

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

  const accordionTitle = useMemo(
    () => dictionary["orders.orderProducts"] || "Order Products",
    [dictionary]
  );

  const emptyStateText = useMemo(
    () => dictionary["orders.noDetails"] || "No order details available",
    [dictionary]
  );

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
  // Only re-render if orderId or orderData actually changes
  return prevProps.orderId === nextProps.orderId && 
         prevProps.orderData === nextProps.orderData;
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
  emptyText: {
    color: "#666",
    textAlign: "center",
    fontSize: 16,
  },
});
