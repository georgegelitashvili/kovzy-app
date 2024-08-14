import React, { useContext } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { AuthContext } from "./context/AuthProvider";
import { OrdersNavigator, ProductsNavigator, AuthNavigator } from "./components/Stack";
import DrawerContent from "./components/DrawerContent";
import { LanguageContext } from "./components/Language";
import Loader from "./components/generate/loader";

const Drawer = createDrawerNavigator();

const RootNavigator = () => {
  const { user, isLoading } = useContext(AuthContext);

  const { dictionary } = useContext(LanguageContext);

  console.log("user:", user);

  if (!user && isLoading) {
    return <Loader text={dictionary["loading"]} />;
  }

  return (
    <>
      {user !== null ? (
        <Drawer.Navigator
          drawerContent={(props) => <DrawerContent {...props} />}
          initialRouteName="Order"
        >
          <Drawer.Screen
            name="Orders"
            component={OrdersNavigator}
            options={{ title: dictionary["nav.onlineOrders"], unmountOnBlur: true }}
          />
          <Drawer.Screen
            name="Products"
            component={ProductsNavigator}
            options={{ title: dictionary["nav.products"], unmountOnBlur: true }}
          />
        </Drawer.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </>
  );
};

export default RootNavigator;
