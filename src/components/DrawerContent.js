import React, { useState, useContext, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { DrawerItem, DrawerContentScrollView } from "@react-navigation/drawer";
import { Drawer, Text, TouchableRipple, Switch } from "react-native-paper";
import { MaterialCommunityIcons, Fontisto } from "@expo/vector-icons";
import { ToggleTheme, logout } from "../redux/Actions";
import { useDispatch, useSelector } from "react-redux";
import { AuthContext, AuthProvider } from "../context/AuthProvider";
import LanguageSelector from "./generate/LanguageSelector";
import axiosInstance from "../apiConfig/apiRequests";
import { String, LanguageContext } from "./Language";

export default function DrawerContent(props) {
  const dispatch = useDispatch();
  const { isdarkTheme } = useSelector((state) => state.themeReducer);
  const { domain, branchid, branchName, logout } = useContext(AuthContext);
  const { dictionary } = useContext(LanguageContext);

  const [options, setOptions] = useState({}); // api options
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false); // check api options is loaded
  const [branchEnabled, setBranchEnabled] = useState(false);
  const [deliveronEnabled, setDeliveronEnabled] = useState(false);
  const [branchChangeOptions, setBranchChangeOptions] = useState({});
  const [deliveronChangeOptions, setDeliveronChangeOptions] = useState({});

  const [isBranchEnabled, setIsBranchEnabled] = useState(false);
  const [isDeliveronEnabled, setIsDeliveronEnabled] = useState(false);

  const switchDarkTheme = () => {
    return isdarkTheme
      ? dispatch(ToggleTheme(false))
      : dispatch(ToggleTheme(true));
  };

  const apiOptions = () => {
    setOptions({
      url_branchActivity: `https://${domain}/api/branchActivity`,
      url_deliveronStatus: `https://${domain}/api/deliveronStatus`,
      url_branchStatus: `https://${domain}/api/branchStatus`,
      url_deliveronActivity: `https://${domain}/api/deliveronActivity`,
    });
    setOptionsIsLoaded(true);
  };

  const onLogoutPressed = () => {
    dispatch(ToggleTheme(false));
    props.navigation.closeDrawer();
    logout();
  };

  const toggleBranch = () => {
    setBranchEnabled((data) => !data);
    if (isBranchEnabled) {
      axiosInstance
        .post(options.url_branchActivity, branchChangeOptions.data)
        .then((resp) => setBranchEnabled(resp.data.data));
      setIsBranchEnabled(false);
    }
  };

  const toggleDeliveron = () => {
    setDeliveronEnabled((data) => !data);

    if (isDeliveronEnabled) {
      axiosInstance
        .post(options.url_deliveronActivity, deliveronChangeOptions.data)
        .then((resp) => setDeliveronEnabled(resp.data.data));
      setIsDeliveronEnabled(false);
    }
  };

  useEffect(() => {
    if (domain) {
      apiOptions();
    }
  }, [domain]);

  useEffect(() => {
    if (optionsIsLoaded) {
      axiosInstance.post(options.url_deliveronStatus).then((resp) => {
        setDeliveronEnabled(resp.data.data.status == 0 ? true : false);
      });

      if (branchid) {
        axiosInstance
          .post(options.url_branchStatus, { branchid: branchid })
          .then((resp) => {
            setBranchEnabled(resp.data.data);
          });
      }
    }
  }, [optionsIsLoaded, branchid]);

  useEffect(() => {
    setBranchChangeOptions((prev) => ({
      ...prev,
      data: { branchid: branchid, enabled: branchEnabled ? 0 : 1 },
    }));
    setIsBranchEnabled(true);
  }, [branchEnabled, branchid]);

  useEffect(() => {
    setDeliveronChangeOptions((prev) => ({
      ...prev,
      data: { enabled: deliveronEnabled ? 0 : 1 },
    }));
    setIsDeliveronEnabled(true);
  }, [deliveronEnabled]);

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerContent}>
        <View
          style={{
            paddingHorizontal: 21,
            paddingBottom: 10,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Fontisto
            name="radio-btn-active"
            color={branchEnabled ? "#2fa360" : "#f14c4c"}
            style={{ fontSize: 20 }}
          />
          <Text style={{ paddingLeft: 17, fontWeight: "bold" }}>
            {branchName}
          </Text>
        </View>

        <View style={{ paddingLeft: 17, paddingRight: 17 }}>
          <LanguageSelector />
        </View>

        <Drawer.Section style={styles.drawerSection}>
          <DrawerItem
            icon={({ color, size }) => (
              <MaterialCommunityIcons
                name="cards-outline"
                color={color}
                size={size}
              />
            )}
            label={dictionary["nav.products"]}
            onPress={() => {
              props.navigation.navigate("Products", { screen: "Product" });
            }}
          />
          <DrawerItem
            icon={({ color, size }) => (
              <MaterialCommunityIcons
                name="format-list-bulleted"
                color={color}
                size={size}
              />
            )}
            label={dictionary["nav.onlineOrders"]}
            onPress={() => {
              props.navigation.navigate("Orders", { screen: "Order" });
            }}
          />
          <DrawerItem
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="logout" color={color} size={size} />
            )}
            label={dictionary.logout}
            onPress={onLogoutPressed}
          />
        </Drawer.Section>
        <Drawer.Section theme="dark">
          <TouchableRipple onPress={toggleDeliveron}>
            <View style={styles.preference}>
              <Text>{dictionary["dv.deliveron"]}</Text>
              <View pointerEvents="none">
                <Switch value={deliveronEnabled} />
              </View>
            </View>
          </TouchableRipple>

          <TouchableRipple onPress={toggleBranch}>
            <View style={styles.preference}>
              <Text>{dictionary["orders.branch"]}</Text>
              <View pointerEvents="none">
                <Switch value={branchEnabled} />
              </View>
            </View>
          </TouchableRipple>

          <TouchableRipple onPress={switchDarkTheme}>
            <View style={styles.preference}>
              <Text>Dark Theme</Text>
              <View pointerEvents="none">
                <Switch value={isdarkTheme} />
              </View>
            </View>
          </TouchableRipple>
        </Drawer.Section>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  userInfoSection: {
    paddingLeft: 20,
  },
  title: {
    marginTop: 20,
    fontWeight: "bold",
  },
  caption: {
    fontSize: 14,
    lineHeight: 14,
  },
  row: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  section: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  paragraph: {
    fontWeight: "bold",
    marginRight: 3,
  },
  drawerSection: {
    marginTop: 15,
  },
  preference: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginTop: 5,
  },
});
