import React, { useContext } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { AuthContext } from "./context/AuthProvider";
import { OrdersNavigator,QrOrdersNavigator, ReportsNavigator, ProductsNavigator, AuthNavigator, SettingsNavigator } from "./components/Stack";
import DrawerContent from "./components/DrawerContent";
import { LanguageContext } from "./components/Language";


const Drawer = createDrawerNavigator();

const RootNavigator = () => {
  const { user, isLoading } = useContext(AuthContext);
  const { dictionary } = useContext(LanguageContext);

  console.log("user:", user);

  return (
    <>
      {user?.token ? (
        <Drawer.Navigator
          drawerContent={(props) => {
            const { key, ...otherProps } = props; // Destructure key from props
            return <DrawerContent {...otherProps} />; // Spread otherProps without key
          }}
          initialRouteName="Order"
        >
          <Drawer.Screen
            name="Orders"
            component={OrdersNavigator}
            options={{ title: dictionary["nav.onlineOrders"], unmountOnBlur: true }}
          />
          <Drawer.Screen
            name="QrOrders"
            component={QrOrdersNavigator}
            options={{ title: dictionary["nav.QROrders"], unmountOnBlur: true }}
          />
          <Drawer.Screen
            name="Reports"
            component={ReportsNavigator}
            options={{ title: dictionary["nav.Reports"], unmountOnBlur: true }}
          />


          <Drawer.Screen
            name="Products"
            component={ProductsNavigator}
            options={{ title: dictionary["nav.products"], unmountOnBlur: true }}
          />
          <Drawer.Screen
            name="Settings"
            component={SettingsNavigator}
            options={{ title: dictionary["settings"], unmountOnBlur: true }}
          />
        </Drawer.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </>
  );
};

export default RootNavigator;
