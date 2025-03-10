import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Card, Text, Divider } from 'react-native-paper';
import { MaterialCommunityIcons, SimpleLineIcons } from '@expo/vector-icons';
import OrdersDetail from '../../OrdersDetail';

const OnlineOrdersCard = ({ item, dictionary, currency, scheduled, isOpen, toggleContent }) => {
    const deliveryPrice = parseFloat(item.delivery_price);
    const additionalFees = parseFloat(item.service_fee) / 100;
    const feeData = JSON.parse(item.fees_details || '{}');
    const feesDetails = scheduled?.reduce((acc, fee) => {
        const feeId = fee['id'];
        if (feeData[feeId]) {
            acc.push(`${fee['value']} : ${parseFloat(feeData[feeId])}`);
        }
        return acc;
    }, []);

    const isScheduled = item.take_away ? scheduled.scheduled_takeaway : scheduled.scheduled_delivery;

    return (
        <Card key={item.id} style={styles.card}>
            <TouchableOpacity onPress={() => toggleContent(item.id)}>
                <Card.Content style={styles.head}>
                    <Text variant="headlineMedium" style={styles.header}>
                        <MaterialCommunityIcons
                            name="music-accidental-sharp"
                            style={styles.leftIcon}
                        />
                        {item.id}
                    </Text>
                    <Text style={styles.takeAway}>{item.take_away === 1 ? `(${dictionary["orders.takeAway"]})` : ""}</Text>
                    <Text variant="headlineMedium" style={styles.header}>
                        <SimpleLineIcons
                            name={!isOpen.includes(item.id) ? "arrow-up" : "arrow-down"}
                            style={styles.rightIcon}
                        />
                    </Text>
                </Card.Content>
            </TouchableOpacity>
            {!isOpen.includes(item.id) ? (
                <Card.Content>
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

                    {item.delivery_scheduled ? (
                        <Text variant="titleSmall" style={styles.title} numberOfLines={2} ellipsizeMode="tail">
                            {dictionary["orders.scheduledDeliveryTime"]}: {item.delivery_scheduled}
                        </Text>
                    ) : null}

                    {item.comment ? (
                        <Text variant="titleSmall" style={styles.title} numberOfLines={2} ellipsizeMode="tail">
                            {dictionary["orders.comment"]}: {item.comment}
                        </Text>
                    ) : null}

                    <Text variant="titleSmall" style={styles.title} numberOfLines={2} ellipsizeMode="tail">
                        {dictionary["orders.paymentMethod"]}: {item.payment_type}
                    </Text>

                    <Divider />
                    <OrdersDetail orderId={item.id} />
                    <Divider />

                    <Text variant="titleMedium" style={styles.title}> {dictionary["orders.initialPrice"]}: {item.real_price} {currency}</Text>

                    <Text variant="titleMedium" style={styles.title}> {dictionary["orders.discountedPrice"]}: {item.price} {currency}</Text>

                    <Text variant="titleMedium" style={styles.title}> {dictionary["orders.deliveryPrice"]}: {deliveryPrice} {currency}</Text>

                    {feesDetails?.length > 0 && (
                        <View>
                            <Text variant="titleMedium" style={styles.title}>
                                {dictionary["orders.additionalFees"]}: {additionalFees} {currency}
                            </Text>
                            <View>
                                {feesDetails.map((feeDetail, index) => (
                                    <Text key={index} variant="titleSmall" style={styles.title}>
                                        {feeDetail}
                                    </Text>
                                ))}
                            </View>
                        </View>
                    )}
                </Card.Content>
            ) : null}
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 10,
    },
    head: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    header: {
        flex: 1,
    },
    leftIcon: {
        marginRight: 10,
    },
    rightIcon: {
        marginLeft: 10,
    },
    takeAway: {
        color: 'red',
    },
    title: {
        marginBottom: 5,
    },
});

export default OnlineOrdersCard;