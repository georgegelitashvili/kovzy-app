import React, { useContext } from "react";
import { StyleSheet, View, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Text, Card, Divider } from 'react-native-paper';
import { MaterialCommunityIcons, SimpleLineIcons } from '@expo/vector-icons';
import OrdersDetail from '../OrdersDetail';
import { LanguageContext } from "../Language";
import { canEditOrder } from "../../utils/canEditOrder";
import { OrderActionIcon, OrderActionRow } from "./OrderActionButtons";

const OrderCard = (props) => {
  // Ensure all props exist before destructuring
  const safeProps = {
    item: props.item,
    currency: props.currency || '',
    isOpen: props.isOpen || false,
    fees: props.fees || [],
    scheduled: props.scheduled || {},
    orderData: props.orderData || [],
    detailsLoading: props.detailsLoading || false,
    onToggle: props.onToggle,
    onAccept: props.onAccept,
    onDelay: props.onDelay,
    onSchedule: props.onSchedule,
    onReject: props.onReject,
    onEdit: props.onEdit,
    loading: props.loading || false
  };
  
  const {
    item,
    currency,
    isOpen,
    fees,
    scheduled,
    orderData,
    detailsLoading,
    onToggle,
    onAccept,
    onDelay,
    onSchedule,
    onReject,
    onEdit,
    loading
  } = safeProps;
  const showEdit = canEditOrder(item) && typeof onEdit === 'function';
  const { width } = useWindowDimensions();
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

  const { dictionary } = useContext(LanguageContext);
  const isScheduled = item.take_away ? scheduled.scheduled_takeaway : scheduled.scheduled_delivery;
  const showDelay = item.delivery_scheduled !== null && isScheduled;
  const showSchedule = typeof onSchedule === 'function';

  const renderButtons = () => {
    return (
      <OrderActionRow>
        <OrderActionIcon
          variant="accept"
          icon="check-decagram-outline"
          disabled={loading}
          onPress={() => !loading && onAccept(item.id, item.take_away)}
        />

        {showEdit && (
          <OrderActionIcon
            variant="edit"
            icon="pencil-outline"
            disabled={loading}
            onPress={() => !loading && onEdit(item)}
          />
        )}

        {showSchedule && (
          <OrderActionIcon
            variant="schedule"
            icon="clock-outline"
            disabled={loading}
            onPress={() => !loading && onSchedule(item.id)}
          />
        )}

        {showDelay && (
          <OrderActionIcon
            variant="delay"
            icon="bell-ring-outline"
            disabled={loading}
            onPress={() => !loading && onDelay(item.id, item.delivery_scheduled)}
          />
        )}

        <OrderActionIcon
          variant="reject"
          icon="close-circle-outline"
          disabled={loading}
          onPress={() => !loading && onReject(item.id)}
        />
      </OrderActionRow>
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
              name={isOpen ? "arrow-up" : "arrow-down"}
              style={styles.rightIcon}
            />
          </Text>
        </Card.Content>
      </TouchableOpacity>

      {isOpen && (
        <Card.Content>
          <OrderDetails
            item={item}
            dictionary={dictionary}
            currency={currency}
            deliveryPrice={deliveryPrice}
            additionalFees={additionalFees}
            feesDetails={feesDetails}
            orderData={orderData}
            detailsLoading={detailsLoading}
          />

          <Card.Actions>
            {renderButtons()}
          </Card.Actions>
        </Card.Content>
      )}
    </Card>
  );
};

const OrderDetails = ({
  item,
  dictionary,
  currency,
  deliveryPrice,
  additionalFees,
  feesDetails,
  orderData,
  detailsLoading,
}) => {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 400;
  const textSize = isSmallScreen ? 13 : 14;
  
  return (
    <>
      <Text variant="titleSmall" style={[styles.title, { fontSize: textSize }]}>
        {dictionary["orders.status"]}: {dictionary["orders.pending"]}
      </Text>

      <Text variant="titleSmall" style={[styles.title, { fontSize: textSize }]} numberOfLines={2} ellipsizeMode="tail">
        {dictionary["orders.fName"]}: {item.firstname} {item.lastname}
      </Text>

      <Text variant="titleSmall" style={[styles.title, { fontSize: textSize }]}>
        {dictionary["orders.phone"]}: {item.phone_number}
      </Text>

      <Text variant="titleSmall" style={[styles.title, { fontSize: textSize }]} ellipsizeMode="tail">
        {dictionary["orders.address"]}: {item.address}
      </Text>

      {item.delivery_scheduled && (
        <Text variant="titleSmall" style={[styles.title, { fontSize: textSize }]} numberOfLines={2} ellipsizeMode="tail">
          {dictionary["orders.scheduledDeliveryTime"]}: {item.delivery_scheduled}
        </Text>
      )}

      {item.comment && (
        <Text variant="titleSmall" style={[styles.title, { fontSize: textSize }]}>
          {dictionary["orders.comment"]}: {item.comment}
        </Text>
      )}

      <Text variant="titleSmall" style={[styles.title, { fontSize: textSize }]} numberOfLines={2} ellipsizeMode="tail">
        {dictionary["orders.paymentMethod"]}: {item.payment_type}
      </Text>

      <Divider />
      <OrdersDetail
        orderId={item.id}
        orderData={orderData || []}
        isLoading={detailsLoading}
      />
      <Divider />

      <PriceDetails
        item={item}
        dictionary={dictionary}
        currency={currency}
        deliveryPrice={deliveryPrice}
        additionalFees={additionalFees}
        feesDetails={feesDetails}
        textSize={textSize}
      />
    </>
  );
};

const PriceDetails = ({ item, dictionary, currency, deliveryPrice, additionalFees, feesDetails, textSize }) => (
  <>
    <Text variant="titleMedium" style={[styles.title, { fontSize: textSize + 1 }]}>
      {dictionary["orders.initialPrice"]}: {item.real_price} {currency}
    </Text>

    <Text variant="titleMedium" style={[styles.title, { fontSize: textSize + 1 }]}>
      {dictionary["orders.discountedPrice"]}: {item.price} {currency}
    </Text>

    <Text variant="titleMedium" style={[styles.title, { fontSize: textSize + 1 }]}>
      {dictionary["orders.deliveryPrice"]}: {deliveryPrice} {currency}
    </Text>

    {feesDetails?.length > 0 && (
      <View>
        <Text variant="titleMedium" style={[styles.title, { fontSize: textSize + 1 }]}>
          {dictionary["orders.additionalFees"]}: {additionalFees} {currency}
        </Text>
        <View style={styles.feeDetailsContainer}>
          {feesDetails.map((fee, index) => (
            <Text key={index} style={[styles.feeDetailText, { fontSize: textSize }]}>
              {fee} {currency}
            </Text>
          ))}
        </View>
      </View>
    )}

    <Text variant="titleMedium" style={[styles.title, { fontSize: textSize + 1 }]}>
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
    alignItems: "center",
  },
  header: {
    paddingVertical: 10,
    fontSize: 18,
  },
  takeAway: {
    paddingVertical: 20,
    fontSize: 15,
    flex: 1,
    textAlign: 'center',
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
    paddingVertical: 8,
    lineHeight: 20,
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
});

function arePropsEqual(prev, next) {
  return (
    prev.item?.id === next.item?.id &&
    prev.item?.price === next.item?.price &&
    prev.item?.total_cost === next.item?.total_cost &&
    prev.item?.can_edit_order === next.item?.can_edit_order &&
    prev.item?.use_preauthorization === next.item?.use_preauthorization &&
    prev.item?.pay_type === next.item?.pay_type &&
    prev.item?.delivery_scheduled === next.item?.delivery_scheduled &&
    prev.isOpen === next.isOpen &&
    prev.loading === next.loading &&
    prev.currency === next.currency &&
    prev.orderData === next.orderData &&
    prev.detailsLoading === next.detailsLoading &&
    prev.fees === next.fees &&
    prev.scheduled === next.scheduled &&
    prev.onEdit === next.onEdit &&
    prev.onSchedule === next.onSchedule
  );
}

export default React.memo(OrderCard, arePropsEqual);
