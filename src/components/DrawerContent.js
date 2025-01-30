import React, { useState, useContext, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { DrawerItem, DrawerContentScrollView } from "@react-navigation/drawer";
import { Drawer, Text, TouchableRipple, Switch } from "react-native-paper";
import { MaterialCommunityIcons, Fontisto, SimpleLineIcons } from "@expo/vector-icons";
import { AuthContext, AuthProvider } from "../context/AuthProvider";
import LanguageSelector from "./generate/LanguageSelector";
import axiosInstance from "../apiConfig/apiRequests";
import { String, LanguageContext } from "./Language";

export default function DrawerContent(props) {

  const { key, ...otherProps } = props;
  const { domain, branchid, branchName, branchEnabled, setBranchEnabled, setDeliveronEnabled, deliveronEnabled, logout, intervalId, setIsLoading } = useContext(AuthContext);
  const { dictionary, userLanguage } = useContext(LanguageContext);
  const [qrOrdersBadge, setQrOrdersBadge] = useState(0);
  const [onlineOrdersBadge, setOnlineOrdersBadge] = useState(0);

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
  const [loading, setLoading] = useState(false);

  const apiOptions = () => {
    setOptions({
      url_branchActivity: `https://${domain}/api/v1/admin/branchActivity`,
      url_deliveronStatus: `https://${domain}/api/v1/admin/deliveronStatus`,
      url_branchStatus: `https://${domain}/api/v1/admin/branchStatus`,
      url_deliveronActivity: `https://${domain}/api/v1/admin/deliveronActivity`,
    });
    setOptionsIsLoaded(true);
  };
  const fetchUnansweredOrders = async () => {
    try {
      const [responseQr, responseOnline] = await Promise.all([
        axiosInstance.post(`https://${domain}/api/v1/admin/getUnansweredOrders`, { type: 1, branchid }),
        axiosInstance.post(`https://${domain}/api/v1/admin/getUnansweredOrders`, { type: 0, branchid,postponeOrder: false })
      ]);

      const ordersQr = responseQr.data.data; 
      const ordersOnline = responseOnline.data.data;

      setQrOrdersBadge(ordersQr.length);
      setOnlineOrdersBadge(ordersOnline.length);

    } catch (error) {
      console.error("Error fetching unanswered orders:", error);
    }
  };


  useEffect(() => {
    fetchUnansweredOrders();
    const intervalId = setInterval(fetchUnansweredOrders, 10000);
  
    return () => clearInterval(intervalId);
  }, [branchid, domain]);

  const onLogoutPressed = () => {
    setIsLoading(true);
    props.navigation.closeDrawer();
    clearInterval(intervalId);
    logout();
  };

  const toggleBranch = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const resp = await axiosInstance.post(
        options.url_branchActivity,
        branchChangeOptions.data
      );
      setBranchEnabled(resp.data.data);
    } catch (error) {
      console.error('Branch toggle failed:', error);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 1500);
    }
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
    <DrawerContentScrollView {...otherProps}>
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
          <Text style={{ paddingLeft: 17, color: '#090909', fontWeight: "bold" }}>
            {branchName?.titles[userLanguage]}
          </Text>
        </View>

        <View style={{ paddingLeft: 17, paddingRight: 17 }}>
          <LanguageSelector />
        </View>

        <Drawer.Section style={styles.drawerSection}>
          <TouchableRipple style={styles.ripple} onPress={toggleBranch}>
            <View style={styles.preference}>
              <Text style={{ color: '#090909', fontWeight: "bold" }}>{dictionary["orders.branch"]}</Text>
              <View pointerEvents="none" style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Switch
                  value={branchEnabled}
                  onValueChange={toggleBranch}
                  disabled={loading}
                />
                {loading && (
                  <ActivityIndicator
                    size="small"
                    color="#0000ff"
                    style={{ marginLeft: 10 }}
                  />
                )}
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
              <MaterialCommunityIcons name="format-list-bulleted" color={color} size={size} />
            )}
            label={() => (
              <View style={styles.labelContainer}>
                <Text style={styles.labelText}>{dictionary["nav.onlineOrders"]}</Text>
                {onlineOrdersBadge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{onlineOrdersBadge}</Text>
                  </View>
                )}
              </View>
            )}
            onPress={() => props.navigation.navigate("Orders")}
          />
          <DrawerItem
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="qrcode-scan" color={color} size={size} />
            )}
            label={() => (
              <View style={styles.labelContainer}>
                <Text style={styles.labelText}>{dictionary["nav.QROrders"]}</Text>
                {qrOrdersBadge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{qrOrdersBadge}</Text>
                  </View>
                )}
              </View>
            )}
            onPress={() => props.navigation.navigate("QrOrders")}
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
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  labelText: {
    fontSize: 16,
  },
  badge: {
    backgroundColor: "red",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  badgeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
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
