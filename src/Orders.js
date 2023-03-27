import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import TabContent from "./components/Tab";
import { EnteredOrdersList } from "./components/orders/EnteredOrders";
import { AcceptedOrdersList } from "./components/orders/AcceptedOrders";


export default function Orders({ navigation }) {
  const { isLoggingIn } = useSelector((state) => state.authReducer);

  const obj = {
    tab1: useCallback(EnteredOrdersList()),
    tab2: useCallback(AcceptedOrdersList()),
  };

  return (
    <TabContent tabsObject={obj} />
  );
}