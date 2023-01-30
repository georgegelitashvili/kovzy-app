import React from "react";

import TabContent from "./components/Tab";
import { EnteredOrdersList } from "./components/orders/EnteredOrders";


export default function Orders({ navigation }) {

  const obj = {
    tab1: EnteredOrdersList(),
    // tab2: AcceptedOrdersList(),
  };

  return (
      <TabContent tabsObject={obj} />
  );
}