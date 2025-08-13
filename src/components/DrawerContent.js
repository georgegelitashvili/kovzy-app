import React, { useState, useContext, useEffect, useRef } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { DrawerItem, DrawerContentScrollView } from "@react-navigation/drawer";
import { Drawer, Text, TouchableRipple, Switch } from "react-native-paper";
import { MaterialCommunityIcons, Fontisto, SimpleLineIcons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthProvider";
import LanguageSelector from "./generate/LanguageSelector";
import axiosInstance from "../apiConfig/apiRequests";
import { LanguageContext } from "./Language";
import eventEmitter from "../utils/EventEmitter";

export default function DrawerContent(props) {
  const { navigation, ...otherProps } = props;
  const { domain, branchid, branchName, branchEnabled, setBranchEnabled, logout, setIsLoading, setIsVisible, handleError, clearErrors } = useContext(AuthContext);
  const { dictionary, userLanguage } = useContext(LanguageContext);
  const [qrOrdersBadge, setQrOrdersBadge] = useState(0);
  const [onlineOrdersBadge, setOnlineOrdersBadge] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  const fetchUnansweredOrders = async () => {
    if (!domain || !branchid) return;
    
    try {
      const [responseQr, responseOnline] = await Promise.all([
        axiosInstance.post(`https://${domain}/api/v1/admin/getUnansweredOrders`,
          { type: 1, branchid },
          { timeout: 5000 }
        ),
        axiosInstance.post(`https://${domain}/api/v1/admin/getUnansweredOrders`,
          { type: 0, branchid, postponeOrder: false },
          { timeout: 5000 }
        )
      ]);

      if (responseQr.data && responseOnline.data) {
        setQrOrdersBadge(responseQr.data.data.length);
        setOnlineOrdersBadge(responseOnline.data.data.length);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      if (error.message?.includes('timeout')) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    }
  };

  useEffect(() => {
    console.log('🚨 BranchName updated in component:', branchName);
  }, [branchName]);

  useEffect(() => {
    fetchUnansweredOrders();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(fetchUnansweredOrders, 10000);

    // Listen for forceLogout event to clear interval
    const logoutListener = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setQrOrdersBadge(0);
      setOnlineOrdersBadge(0);
    };
    eventEmitter.addEventListener('forceLogout', logoutListener);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      eventEmitter.removeEventListener(logoutListener);
    };
  }, [branchid, domain]);

  const onLogoutPressed = () => {
    setIsLoading(true);
    props.navigation.closeDrawer();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    // Call logout with navigation to force reset
    logout(props.navigation);
  };

  const toggleBranch = async () => {
    if (loading || !domain || !branchid) return;

    const newStatus = !branchEnabled; // toggle
    setLoading(true);

    console.log("Toggling branch status:", newStatus, "for branch ID:", branchid);

    try {
      const resp = await axiosInstance.post(
        `https://${domain}/api/v1/admin/branchActivity`,
        {
          branchid,
          enabled: newStatus ? 0 : 1, // 0 → ჩართვა, 1 → გათიშვა
        }
      );

      const result = resp?.data?.data;
      console.log("Toggle branch response:", resp?.data);

      if (typeof result === "boolean") {
        const isEnabled = result; // true = enabled, false = disabled
        const isClosed = !isEnabled; // true = closed, false = open
        setBranchEnabled(isClosed);     // Switch state
        setIsVisible(isClosed);          // Toast visibility

        if (!isClosed) {
          handleError(
            { message: dictionary?.["orders.branchDisabled"] || "Branch is temporarily closed" },
            "BRANCH_TEMPORARILY_CLOSED",
            { persistent: true }
          );
        } else {
          console.log('🟢 Branch enabled, clearing persistent errors');
          clearErrors();
        }
      } else {
        console.warn("Unexpected response in toggleBranch:", resp?.data);
        handleError(new Error("Invalid toggle response format"), "TOGGLE_BRANCH_INVALID");
      }

    } catch (error) {
      console.error("Branch toggle failed:", error);
      handleError(error, "TOGGLE_BRANCH_ERROR");

      // optional: fallback მდგომარეობაზე არ გააკეთოს setBranchEnabled, შეინარჩუნოს არსებული
    } finally {
      setLoading(false);
    }
  };

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
          key="products"
          icon={({ color, size }) => (
            <MaterialCommunityIcons
              name="cards-outline"
              color={color}
              size={size}
            />
          )}
          label={dictionary["nav.products"]}
          onPress={() => navigation.navigate("Products")}
        />
        <DrawerItem
          key="online-orders"
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
          onPress={() => {
            navigation.closeDrawer();
            navigation.navigate("Orders", { screen: "EnteredOrders" });
          }}
        />
        <DrawerItem
          key="qr-orders"
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
          onPress={() => {
            navigation.closeDrawer();
            navigation.navigate("QrOrders", { screen: "QrOrdersScreen" });
          }}
        />
        <DrawerItem
          key="reports"
          icon={({ color, size }) => (
            <MaterialCommunityIcons name="chart-line" color={color} size={size} />
          )}
          label={dictionary["nav.Reports"]}
          onPress={() => {
            navigation.closeDrawer();
            navigation.navigate("Reports", { screen: "ReportsScreen" });
          }}
        />
        <DrawerItem
          key="settings"
          icon={({ color, size }) => (
            <SimpleLineIcons name="settings" color={color} size={size} />
          )}
          label={dictionary["settings"]}
          onPress={() => navigation.navigate("Settings")}
        />
        <DrawerItem
          key="logout"
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
