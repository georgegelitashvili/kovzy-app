import React from "react";
import TabContent from "./components/Tab";
import  { EnteredOrdersList } from "./components/orders/EnteredOrders";
import { AcceptedOrdersList } from "./components/orders/AcceptedOrders";


export default function Orders({ navigation }) {
  return (
    <TabContent tab1={EnteredOrdersList(navigation)} tab2={AcceptedOrdersList(navigation)} />
  );
}