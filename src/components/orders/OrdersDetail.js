import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { StyleSheet, } from "react-native";
import {
  List,
} from "react-native-paper";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome,
} from "@expo/vector-icons";



export default function OrdersDetail({ ordersDetail })
{
    const [expanded, setExpanded] = useState(true);
    const handlePress = () => setExpanded(!expanded);

    return (
        <List.Section style={styles.accordion}>
            <List.Accordion
                title="Menu"
                left={(props) => <Ionicons {...props} name="options-outline" size={30} />}
                expanded={expanded}
                onPress={handlePress}
            >
                {Object.values(ordersDetail.rating)?.map((orders, index) => <List.Item key={index.toString()} title={orders} />)}
                
            </List.Accordion>
        </List.Section>
    )
}


const styles = StyleSheet.create({
    accordion: {
        background: "#fff",
    }
});