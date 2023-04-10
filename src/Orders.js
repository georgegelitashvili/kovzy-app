import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import TabContent from "./components/Tab";
import { authorizedLegal } from "./helpers/authorized";
import { EnteredOrdersList } from "./components/orders/EnteredOrders";
import { AcceptedOrdersList } from "./components/orders/AcceptedOrders";


export default function Orders({ navigation }) {
  const authlegal = authorizedLegal();

  // console.log('--------------------- order auth');
  // console.log(authlegal);
  // console.log('--------------------- end order auth');

  // useEffect(() => {
  //   if(authlegal == false) {
  //     navigation.navigate("Start", { screen: "Domain" });
  //     return;
  //   }
  // }, [authlegal])


  const obj = {
    tab1: useCallback(EnteredOrdersList(authlegal)),
    tab2: useCallback(AcceptedOrdersList(authlegal)),
  };



  return (
    <TabContent tabsObject={obj} />
  );
}