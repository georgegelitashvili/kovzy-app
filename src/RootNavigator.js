import React, { useContext, useState, useEffect, useCallback } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import * as SecureStore from "expo-secure-store";
import { AuthContext } from "./context/AuthProvider";
import { OrdersNavigator, ProductsNavigator, AuthNavigator } from "./components/Stack";
import DrawerContent from "./components/DrawerContent";
import { LanguageContext } from "./components/Language";
import Loader from "./components/generate/loader";
import axiosInstance from "./apiConfig/apiRequests";
import { getData } from "./helpers/storage";

const Drawer = createDrawerNavigator();

const RootNavigator = () => {
  const { user, setUser, domain } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [options, setOptions] = useState({
    url_authUser: "",
  });
  const { dictionary } = useContext(LanguageContext);

  const apiOptions = useCallback(() => {
    if (domain) {
      setOptions({
        url_authUser: `https://${domain}/api/v1/admin/auth/authorized`,
      });
    }
  }, [domain]);

  useEffect(() => {
    apiOptions();
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (options.url_authUser) {
          const response = await axiosInstance.post(options.url_authUser);
          if (response.data.user) {
            const userObj = getData('user');
            setUser(userObj);
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Error loading user:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [user, options.url_authUser]);


  if (isLoading) {
    return <Loader text={dictionary["loading"]} />;
  }

  return (
    <>
      {user ? (
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
