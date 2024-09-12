import React, { useState, useContext, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { DrawerItem, DrawerContentScrollView } from "@react-navigation/drawer";
import { Drawer, Text, TouchableRipple, Switch } from "react-native-paper";
import { MaterialCommunityIcons, Fontisto, SimpleLineIcons } from "@expo/vector-icons";
import { AuthContext, AuthProvider } from "../context/AuthProvider";
import LanguageSelector from "./generate/LanguageSelector";
import axiosInstance from "../apiConfig/apiRequests";
import { String, LanguageContext } from "./Language";

export default function DrawerContent(props) {

  const { domain, branchid, branchName, branchEnabled, setBranchEnabled, setDeliveronEnabled, deliveronEnabled, logout, intervalId, setIsLoading } = useContext(AuthContext);
  const { dictionary, userLanguageChange } = useContext(LanguageContext);

  const [options, setOptions] = useState({
    url_branchActivity: "",
    url_deliveronStatus: "",
    url_branchStatus: "",
    url_deliveronActivity: "",
  }); // api options
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false); // check api options is loaded
  const [branchChangeOptions, setBranchChangeOptions] = useState({});
  const [deliveronChangeOptions, setDeliveronChangeOptions] = useState({});

  const [isBranchEnabled, setIsBranchEnabled] = useState(false);
  const [isDeliveronEnabled, setIsDeliveronEnabled] = useState(false);

  const apiOptions = () => {
    setOptions({
      url_branchActivity: `https://${domain}/api/v1/admin/branchActivity`,
      url_deliveronStatus: `https://${domain}/api/v1/admin/deliveronStatus`,
      url_branchStatus: `https://${domain}/api/v1/admin/branchStatus`,
      url_deliveronActivity: `https://${domain}/api/v1/admin/deliveronActivity`,
    });
    setOptionsIsLoaded(true);
  };

  const onLogoutPressed = () => {
    setIsLoading(true);
    props.navigation.closeDrawer();
    clearInterval(intervalId);
    logout();
  };

  const toggleBranch = async () => {
    await axiosInstance
      .post(options.url_branchActivity, branchChangeOptions.data)
      .then((resp) => setBranchEnabled(resp.data.data));
  };

  const toggleDeliveron = async () => {
    await axiosInstance
      .post(options.url_deliveronActivity, deliveronChangeOptions.data)
      .then((resp) => setDeliveronEnabled(resp.data.data));
  };

  useEffect(() => {
    if (domain) {
      apiOptions();
    }
  }, [domain]);

  useEffect(() => {
    setBranchChangeOptions((prev) => ({
      ...prev,
      data: { branchid: branchid, enabled: branchEnabled ? 1 : 0 },
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
          <TouchableRipple onPress={toggleDeliveron}>
            <View style={styles.preference}>
              <Text>{dictionary["dv.deliveron"]}</Text>
              <View pointerEvents="none">
                <Switch value={deliveronEnabled} />
              </View>
            </View>
          </TouchableRipple>

          <TouchableRipple style={styles.ripple} onPress={toggleBranch}>
            <View style={styles.preference}>
              <Text>{dictionary["orders.branch"]}</Text>
              <View pointerEvents="none">
                <Switch value={branchEnabled} />
              </View>
            </View>
          </TouchableRipple>
        </Drawer.Section>


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
              props.navigation.navigate("Products");
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
              props.navigation.navigate("Orders");
            }}
          />
          <DrawerItem
            icon={({ color, size }) => (
              <SimpleLineIcons name="settings"
                color={color}
                size={size} />
            )}
            label={dictionary["settings"]}
            onPress={() => {
              props.navigation.navigate("Settings");
            }}
          />
          <DrawerItem
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="logout" color={color} size={size} />
            )}
            label={dictionary.logout}
            onPress={onLogoutPressed}
          />

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
    marginTop: 6,
    marginBottom: 10
  },
  ripple: {
    marginTop: 6,
  },
  preference: {
    flexDirection: "row",
    alignItems: 'center',
    justifyContent: "space-between",
    paddingVertical: 1,
    paddingHorizontal: 20,
    elevation: 2,
  },
});
