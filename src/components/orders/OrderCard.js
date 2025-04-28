import React, { useContext } from "react";
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text, Card, Divider } from 'react-native-paper';
import { MaterialCommunityIcons, SimpleLineIcons } from '@expo/vector-icons';
import OrdersDetail from '../OrdersDetail';
import { String, LanguageContext } from "../Language";

const OrderCard = ({
  item,
  currency,
  isOpen,
  fees,
  scheduled,
  onToggle,
  onAccept,
  onDelay,
  onReject,
  loading
}) => {
  console.log("OrderCard", item);
  const deliveryPrice = parseFloat(item.delivery_price);
  const additionalFees = parseFloat(item.service_fee) / 100;
  const feeData = JSON.parse(item.fees_details || '{}');
  const feesDetails = fees?.reduce((acc, fee) => {
    const feeId = fee['id'];
    if (feeData[feeId]) {
      acc.push(`${fee['value']} : ${parseFloat(feeData[feeId])}`);
    }
    return acc;
  }, []);

  const { dictionary, languageId } = useContext(LanguageContext);
  const isScheduled = item.take_away ? scheduled.scheduled_takeaway : scheduled.scheduled_delivery;

  const renderButtons = () => {
    const isTakeAway = item.take_away === 1;
    const hasDeliveryScheduled = item.delivery_scheduled && item.delivery_scheduled.length > 0;
    const showDelayButton = isTakeAway && hasDeliveryScheduled;

    return (
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.buttonAccept, loading && styles.buttonDisabled]}
          onPress={() => !loading && onAccept(item.id, item.take_away)}
          disabled={loading}
        >
          <MaterialCommunityIcons name="check-decagram-outline" size={30} color="white" />
        </TouchableOpacity>

        {item.delivery_scheduled !== null && isScheduled && (
          <TouchableOpacity
            style={[styles.buttonDelay, loading && styles.buttonDisabled]}
            onPress={() => !loading && onDelay(item.id, item.delivery_scheduled)}
            disabled={loading}
          >
            <MaterialCommunityIcons name="bell-ring-outline" size={30} color="white" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.buttonReject, loading && styles.buttonDisabled]}
          onPress={() => !loading && onReject(item.id)}
          disabled={loading}
        >
          <MaterialCommunityIcons name="close-circle-outline" size={30} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Card key={item.id} style={styles.card}>
      <TouchableOpacity onPress={() => !loading && onToggle(item.id)} disabled={loading}>
        <Card.Content style={styles.head}>
          <Text variant="headlineMedium" style={styles.header}>
            <MaterialCommunityIcons
              name="music-accidental-sharp"
              style={styles.leftIcon}
            />
            {item.id}
          </Text>
          <Text style={styles.takeAway}>
            {item.take_away === 1 ? "(" + dictionary["orders.takeAway"] + ")" : ""}
          </Text>
          <Text variant="headlineMedium" style={styles.header}>
            <SimpleLineIcons
              name={!isOpen ? "arrow-up" : "arrow-down"}
              style={styles.rightIcon}
            />
          </Text>
        </Card.Content>
      </TouchableOpacity>

      {!isOpen && (
        <Card.Content>
          <OrderDetails
            item={item}
            dictionary={dictionary}
            currency={currency}
            deliveryPrice={deliveryPrice}
            additionalFees={additionalFees}
            feesDetails={feesDetails}
          />

          <Card.Actions>
            {renderButtons()}
          </Card.Actions>
        </Card.Content>
      )}
    </Card>
  );
};

const OrderDetails = ({ item, dictionary, currency, deliveryPrice, additionalFees, feesDetails }) => (
  <>
    <Text variant="titleSmall" style={styles.title}>
      {dictionary["orders.status"]}: {dictionary["orders.pending"]}
    </Text>

    <Text variant="titleSmall" style={styles.title} numberOfLines={2} ellipsizeMode="tail">
      {dictionary["orders.fName"]}: {item.firstname} {item.lastname}
    </Text>

    <Text variant="titleSmall" style={styles.title}>
      {dictionary["orders.phone"]}: {item.phone_number}
    </Text>

    <Text variant="titleSmall" style={styles.title} ellipsizeMode="tail">
      {dictionary["orders.address"]}: {item.address}
    </Text>

    {item.delivery_scheduled && (
      <Text variant="titleSmall" style={styles.title} numberOfLines={2} ellipsizeMode="tail">
        {dictionary["orders.scheduledDeliveryTime"]}: {item.delivery_scheduled}
      </Text>
    )}

    {item.comment && (
      <Text variant="titleSmall" style={styles.title} numberOfLines={2} ellipsizeMode="tail">
        {dictionary["orders.comment"]}: {item.comment}
      </Text>
    )}

    <Text variant="titleSmall" style={styles.title} numberOfLines={2} ellipsizeMode="tail">
      {dictionary["orders.paymentMethod"]}: {item.payment_type}
    </Text>

    <Divider />
    <OrdersDetail orderId={item.id} />
    <Divider />

    <PriceDetails
      item={item}
      dictionary={dictionary}
      currency={currency}
      deliveryPrice={deliveryPrice}
      additionalFees={additionalFees}
      feesDetails={feesDetails}
    />
  </>
);

const PriceDetails = ({ item, dictionary, currency, deliveryPrice, additionalFees, feesDetails }) => (
  <>
    <Text variant="titleMedium" style={styles.title}>
      {dictionary["orders.initialPrice"]}: {item.real_price} {currency}
    </Text>

    <Text variant="titleMedium" style={styles.title}>
      {dictionary["orders.discountedPrice"]}: {item.price} {currency}
    </Text>

    <Text variant="titleMedium" style={styles.title}>
      {dictionary["orders.deliveryPrice"]}: {deliveryPrice} {currency}
    </Text>

    {feesDetails?.length > 0 && (
      <View>
        <Text variant="titleMedium" style={styles.title}>
          {dictionary["orders.additionalFees"]}: {additionalFees} {currency}
        </Text>
        <View style={styles.feeDetailsContainer}>
          {feesDetails.map((fee, index) => (
            <Text key={index} style={styles.feeDetailText}>
              {fee} {currency}
            </Text>
          ))}
        </View>
      </View>
    )}

    <Text variant="titleMedium" style={styles.title}>
      {dictionary["orders.totalcost"]}: {item.total_cost} {currency}
    </Text>
  </>
);

const styles = StyleSheet.create({
  card: {
    margin: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    flexWrap: 'nowrap',
    elevation: 8,
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  header: {
    paddingVertical: 10,
  },
  takeAway: {
    paddingVertical: 20,
    fontSize: 15,
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
    lineHeight: 24,
    fontSize: 14,
    flexWrap: 'wrap',
  },
  feeDetailsContainer: {
    paddingLeft: 10,
    marginBottom: 15
  },
  feeDetailText: {
    fontSize: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  buttonAccept: {
    width: 85,
    height: 45,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#2fa360",
    backgroundColor: "#2fa360",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  buttonDelay: {
    width: 85,
    height: 45,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#3490dc",
    backgroundColor: "#3490dc",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  buttonReject: {
    width: 85,
    height: 45,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#f14c4c",
    backgroundColor: "#f14c4c",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  delayIcon: {
    position: 'absolute',
    left: '50%',
    marginLeft: -20,
  },
  delayButtonText: {
    color: "#fff",
    marginLeft: 28,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default React.memo(OrderCard, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.currency === nextProps.currency &&
    prevProps.loading === nextProps.loading &&
    JSON.stringify(prevProps.fees) === JSON.stringify(nextProps.fees)
  );
});
