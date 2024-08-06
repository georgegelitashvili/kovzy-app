import React, { useContext, useState, useEffect, useCallback } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { AuthContext } from "./context/AuthProvider";
import { OrdersNavigator, ProductsNavigator, AuthNavigator } from "./components/Stack";
import DrawerContent from "./components/DrawerContent";
import { LanguageContext } from "./components/Language";
import Loader from "./components/generate/loader";
import axiosInstance from "./apiConfig/apiRequests";
import { getData } from "./helpers/storage";

const Drawer = createDrawerNavigator();

const RootNavigator = () => {
  const { user, setUser, domain, intervalId, setIntervalId } = useContext(AuthContext);
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
  }, [apiOptions]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await axiosInstance.get(options.url_authUser);
        if (response.data.user) {
          const userObj = getData('user'); // Ensure getData is async if necessary
          setUser(userObj);
        } else {
          setUser(null);
          clearInterval(intervalId);
          setIntervalId(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error loading user:", error);
        setUser(null);
        clearInterval(intervalId);
        setIntervalId(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (options.url_authUser) {
      loadUser();
    } else {
      setIsLoading(false);
    }
  }, [options.url_authUser]);

  console.log("user:", user);

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
