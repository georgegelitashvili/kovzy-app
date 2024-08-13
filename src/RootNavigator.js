import React, { useContext, useState, useEffect, useCallback } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { AuthContext } from "./context/AuthProvider";
import { OrdersNavigator, ProductsNavigator, AuthNavigator } from "./components/Stack";
import DrawerContent from "./components/DrawerContent";
import { LanguageContext } from "./components/Language";
import Loader from "./components/generate/loader";
import axiosInstance from "./apiConfig/apiRequests";
import { removeData, getSecureData } from "./helpers/storage";

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
      const userObj = await getSecureData('user');
      console.log('object of user', userObj);

      try {
        if (userObj) {
          const response = await axiosInstance.get(options.url_authUser);
          console.log('check auth response data:', response.data);

          if (response.data.user) {
            setUser(userObj);
          } else {
            setUser(null);
            clearInterval(intervalId);
            setIntervalId(null);
          }
        }
      } catch (error) {
        console.error("Error loading user:", error);
        setUser(null);
        clearInterval(intervalId);
        setIntervalId(null);
      } finally {
        // Add a slight delay before hiding the loader
        setTimeout(() => {
          setIsLoading(false);
        }, 1500); // Adjust the delay time (in milliseconds) as needed
      }
    };

    if (options.url_authUser) {
      setIsLoading(true);
      loadUser();
    } else {
      setIsLoading(false);
    }
  }, [domain, options.url_authUser]);

  console.log("user:", user);
  console.log("loader:", isLoading);

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
