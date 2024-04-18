import React, { useState, useEffect, useContext } from "react";
import TabContent from "./components/Tab";
import { AuthContext } from "./context/AuthProvider";
import { EnteredOrdersList } from "./components/orders/EnteredOrders";
import { AcceptedOrdersList } from "./components/orders/AcceptedOrders";

export default function Orders() {
  const { isDataSet } = useContext(AuthContext);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    if (isDataSet) {
      // Fetch data or perform any necessary operations
      setDataReady(true);
    }
  }, [isDataSet]);

  if (!dataReady) {
    return null; // Render nothing if data is not ready
  }

  return (
    <TabContent tab1={<EnteredOrdersList />} tab2={<AcceptedOrdersList />} />
  );
}
