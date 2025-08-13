import React, { useState, useEffect, useCallback, useContext, useRef } from "react";
import {
    StyleSheet,
    Dimensions,
    View,
    TouchableOpacity,
    Alert,
    AppState,
    FlatList,
    RefreshControl
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Text, Button, Divider, Card } from "react-native-paper";
import { FlatGrid } from "react-native-super-grid";
import { MaterialCommunityIcons, SimpleLineIcons } from "@expo/vector-icons";
import * as Updates from 'expo-updates';

import { AuthContext, AuthProvider } from "../../context/AuthProvider";
import Loader from "../generate/loader";
import TimePicker from "../generate/TimePicker";
import { String, LanguageContext } from "../Language";
import axiosInstance from "../../apiConfig/apiRequests";
import OrdersDetail from "../OrdersDetail";
import OrdersModal from "../modal/OrdersModal";
import printRows from "../../PrintRows";
import NotificationSound from '../../utils/NotificationSound';
import eventEmitter from '../../utils/EventEmitter';

const initialWidth = Dimensions.get("window").width;
const getColumnsByScreenSize = (screenWidth) => {
  if (screenWidth < 600) return 1; // Mobile phones
  if (screenWidth < 960) return 2; // Tablets
  return 3; // Larger screens
};

const initialColumns = getColumnsByScreenSize(initialWidth);
const getCardSize = (width, columns) => width / columns - (columns > 1 ? 15 : 30);

// render entered orders function
export const PostponeOrders = () => {
    const { domain, branchid, setUser, user, shouldRenderAuthScreen, setShouldRenderAuthScreen } = useContext(AuthContext);
    const NotificationSoundRef = useRef(null);
    const intervalRef = useRef(null);
    const [orders, setOrders] = useState([]);
    const [fees, setFees] = useState([]);
    const [currency, setCurrency] = useState("");

    const [options, setOptions] = useState({
        url_unansweredOrders: "",
        url_deliveronRecheck: "",
        url_acceptOrder: "",
        url_rejectOrder: ""
    }); // api options
    const [optionsIsLoaded, setOptionsIsLoaded] = useState(false); // api options
    const [deliveronOptions, setDeliveronOptions] = useState(null);
    const [isDeliveronOptions, setIsDeliveronOptions] = useState(false);

    const [deliveron, setDeliveron] = useState([]);
    const [visible, setVisible] = useState(false); // modal state
    const [itemId, setItemId] = useState(null); //item id for modal
    const [itemTakeAway, setItemTakeAway] = useState(null);
    const [isOpen, setOpenState] = useState([]); // my accordion state
    const [modalType, setModalType] = useState("");

    const [loading, setLoading] = useState(true);
    const [loadingOptions, setLoadingOptions] = useState(false);    const [width, setWidth] = useState(Dimensions.get('window').width);
    const [numColumns, setNumColumns] = useState(getColumnsByScreenSize(width));
    const [cardSize, setCardSize] = useState(getCardSize(width, numColumns));

    const { dictionary, languageId } = useContext(LanguageContext);

    const toggleContent = (value) => {
        setOpenState([...isOpen, value]);

        let index = isOpen.indexOf(value);
        if (index > -1) setOpenState([...isOpen.filter((i) => i !== value)]);
    };

    const handleReload = async () => {
        await Updates.reloadAsync();
    };

    const apiOptions = useCallback(() => {
        setOptions({
            url_unansweredOrders: `https://${domain}/api/v1/admin/getPostponeOrder`,
            url_deliveronRecheck: `https://${domain}/api/v1/admin/deliveronRecheck`,
            url_acceptOrder: `https://${domain}/api/v1/admin/acceptOrder`,
            url_rejectOrder: `https://${domain}/api/v1/admin/rejectOrder`,
        });
        setOptionsIsLoaded(true);
    }, [domain]);

    // modal show
    const showModal = (type) => {
        setModalType(type);
        setVisible(true);
    };    // Update layout on dimension change
    useEffect(() => {
        const updateLayout = () => {
            const newWidth = Dimensions.get('window').width;
            const columns = getColumnsByScreenSize(newWidth);
            setWidth(newWidth);
            setNumColumns(columns);
            setCardSize(getCardSize(newWidth, columns));
        };

        const subscription = Dimensions.addEventListener('change', updateLayout);
        return () => subscription?.remove();
    }, []);

    const fetchPostponeOrders = async () => {
        if (!user || !options.url_unansweredOrders) {
            return null;
        }
        try {
            const resp = await axiosInstance.post(options.url_unansweredOrders, {
                type: 0,
                branchid: branchid,
                Languageid: languageId,
                postponeOrder: true
            });
            const data = resp.data.data;
            const feesData = resp.data.fees;
            setOrders(data);
            setFees(feesData);
            setCurrency(resp.data.currency);
        } catch (error) {
            console.log('Error fetching entered orders full:', error);
            const statusCode = error?.status || 'Unknown';
            console.log('Status code entered orders:', statusCode);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            handleReload();
        } finally {
            setLoading(false);
        }
    };

    const onChangeModalState = (newState) => {
        console.log("modal close: ", newState);
        setTimeout(() => {
            setVisible(false);
            setIsDeliveronOptions(false);
            setLoadingOptions(false);
            setLoading(false);
            setItemId(null);
            setDeliveron([]);
            fetchPostponeOrders();
        }, 0);
    };


    useEffect(() => {
        if (domain && branchid) {
            apiOptions();
        } else if (domain || branchid) {
            setOptionsIsLoaded(false);
            setOrders([]);
        }
        // Listen for forceLogout event to clear all orders and state
        const logoutListener = () => {
            setOrders([]);
            setFees([]);
            setCurrency("");
            setOpenState([]);
            setVisible(false);
            setItemId(null);
            setModalType("");
        };
        eventEmitter.addEventListener('forceLogout', logoutListener);
        return () => {
            eventEmitter.removeEventListener(logoutListener);
        };
    }, [domain, branchid, apiOptions]);

    useFocusEffect(
        React.useCallback(() => {
            fetchPostponeOrders();

            return () => { };
        }, [options, branchid, languageId])
    );


    // set deliveron data
    useEffect(() => {
        // Exit early if `itemTakeAway` is null or 1
        if (itemTakeAway === null || itemTakeAway === 1) return;

        // If `itemId` is null, reset options and exit
        if (!itemId) {
            setIsDeliveronOptions(false);
            return;
        }

        // Update `deliveronOptions` and set flags if necessary
        setDeliveronOptions((prev) => ({
            ...prev,
            data: { orderId: itemId },
        }));
        setIsDeliveronOptions((prev) => prev || true);

    }, [itemId, itemTakeAway]);

    useEffect(() => {
        if (isDeliveronOptions && deliveronOptions.data.orderId) {
            setLoadingOptions(true);
            axiosInstance
                .post(options.url_deliveronRecheck, deliveronOptions.data)
                .then((resp) => resp.data.data)
                .then((data) => {
                    const { status, content } = data.original ?? {};
                    const alertHandler = (message, shouldClearData = false) => Alert.alert("ALERT", message, [
                        {
                            text: "okay",
                            onPress: () => {
                                if (shouldClearData) {
                                    setIsDeliveronOptions(false);
                                    setLoadingOptions(false);
                                    setDeliveronOptions(null);
                                    // setDeliveron([]);
                                } else {
                                    setVisible(false);
                                    setLoadingOptions(false);
                                    setIsDeliveronOptions(false);
                                    setDeliveronOptions(null);
                                    setItemId(null);
                                    // setDeliveron([]);
                                }
                            },
                        },
                    ]);

                    // Handle status -1 or -2 and module off case
                    if (status === -2 && content === "Module is off") {
                        alertHandler("Deliveron module is off", true);
                        setDeliveron(data);
                    } else if (status === -1) {
                        alertHandler("Order ID not passed or invalid.");
                    } else if (Array.isArray(content) && content.length === 0) {
                        alertHandler(dictionary["dv.empty"]);
                    } else {
                        setDeliveron(data);
                        setLoadingOptions(false);
                    }
                })
                .catch((error) => alertHandler("Error fetching deliveron options."));
        }
    }, [isDeliveronOptions, deliveronOptions]);    const RenderPostponeOrdersList = ({ item }) => {
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

        return (
            <View style={{
                width: width / numColumns - (numColumns > 1 ? 15 : 30),
                marginHorizontal: 5
            }}>
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
                            <Text style={styles.takeAway}>{item.take_away === 1 ? "(" + dictionary["orders.takeAway"] + ")" : ""}</Text>
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
                                <Text variant="titleSmall" style={styles.title}>
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
                            <Card.Actions>
                                <TouchableOpacity
                                    style={styles.buttonAccept}
                                    onPress={() => {
                                        setItemId(item.id);
                                        setItemTakeAway(item.take_away);
                                        showModal("accept");
                                    }}
                                >
                                    <MaterialCommunityIcons name="check-decagram-outline" size={30} color="white" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.buttonReject}
                                    onPress={() => {
                                        setItemId(item.id);
                                        setItemTakeAway(null);
                                        showModal("reject");
                                    }}
                                >
                                    <MaterialCommunityIcons name="close-circle-outline" size={30} color="white" />
                                </TouchableOpacity>
                            </Card.Actions>

                        </Card.Content>
                    ) : null}
                </Card>
            </View>
        )
    };

    const getItemLayout = useCallback((data, index) => ({
        length: cardSize,
        offset: cardSize * index,
        index,
    }), [cardSize]);

    return (
        <View style={styles.container}>
            {loadingOptions && <Loader />}
            {loading && <Loader show={loading} />}
            <NotificationSound ref={NotificationSoundRef} />

            {visible && (
                <OrdersModal
                    isVisible={visible}
                    onChangeState={onChangeModalState}
                    orders={orders}
                    hasItemId={itemId}
                    deliveron={deliveron ?? null}
                    deliveronOptions={deliveronOptions}
                    type={modalType}
                    options={options}
                    takeAway={itemTakeAway}
                    PendingOrders={true}
                />
            )}
            
            <FlatList
                key={`flat-list-${numColumns}`}
                numColumns={numColumns}
                getItemLayout={getItemLayout}
                data={orders}
                spacing={10}
                renderItem={({ item }) => <RenderPostponeOrdersList item={item} />}
                keyExtractor={(item) => (item && item.id ? item.id.toString() : '')}
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchPostponeOrders} />
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "flex-start",
    },
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
        color: '#333',
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.7)", // Semi-transparent background
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 20,
        elevation: 5,
        width: "80%",
    },
});