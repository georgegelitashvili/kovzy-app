import React, { useState, useContext, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useIsFocused } from '@react-navigation/native';
import { DrawerItem, DrawerContentScrollView } from "@react-navigation/drawer";
import { Drawer, Text, TouchableRipple, Switch } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ToggleTheme, logout } from "../redux/Actions";
import { useDispatch, useSelector } from "react-redux";
import { AuthContext, AuthProvider } from '../context/AuthProvider';
import { storeData, getData, removeData } from '../helpers/storage';
import LanguageSelector from './generate/LanguageSelector';
import { Request } from "../axios/apiRequests";
import { String, LanguageContext } from './Language';



export default function DrawerContent(props) {
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const { branches } = useSelector((state) => state.branchesReducer);
  const { isdarkTheme } = useSelector((state) => state.themeReducer);
  const { domain, branchid, setUser, setIsDataSet } = useContext(AuthContext);
  const { dictionary } = useContext(LanguageContext);

  // const [domain, setDomain] = useState(null);
  const [domainIsLoaded, setDomainIsLoaded] = useState(false);

  const [options, setOptions] = useState({}); // api options
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false); // check api options is loaded
  const [logoutOptions, setLogoutOptions] = useState({});
  const [logoutOptionsIsLoaded, setLogoutOptionsIsLoaded] = useState(false);
  const [selected, setSelected] = useState(null);
  const [branchEnabled, setBranchEnabled] = useState(false);
  const [deliveronEnabled, setDeliveronEnabled] = useState(false);
  const[deliveronOptions, setDeliveronOptions] = useState({});
  const[deliveronChangeOptions, setDeliveronChangeOptions] = useState({});
  const [deliveronIsLoaded, setDeliveronIsLoaded] = useState(false);

  const [isBranchEnabled, setIsBranchEnabled] = useState(false);
  const [isDeliveronEnabled, setIsDeliveronEnabled] = useState(false);

  const switchDarkTheme = () => {
    return isdarkTheme
      ? dispatch(ToggleTheme(false))
      : dispatch(ToggleTheme(true));
  };

  const onLogoutPressed = () => {
    if(logoutOptionsIsLoaded) {
      console.log(logoutOptions);
      dispatch(logout(logoutOptions));
    }
    removeData();
    props.navigation.closeDrawer();
    setIsDataSet(false);
    setUser(null);
  };

  const changeBranchStatus = () => {
    setOptions({
      method: "POST",
      url: `https://${domain}/api/branchActivity`
    });
    setOptionsIsLoaded(true);
  };

  const deliveronStatus = () => {
    setDeliveronOptions({
      method: "POST",
      url: `https://${domain}/api/deliveronStatus`
    });
    setDeliveronIsLoaded(true);
  };

  const changeDeliveronStatus = () => {
    setDeliveronChangeOptions({
      method: "POST",
      url: `https://${domain}/api/deliveronActivity`
    });
  };

  const readLogout = () => {
    setLogoutOptions({
      method: "GET",
      url: `https://${domain}/api/auth/logout`
    });
    setLogoutOptionsIsLoaded(true);
  };

  const toggleBranch = () => {
    setBranchEnabled(data => !data);

    if(isBranchEnabled){
      Request(options).then(resp => setBranchEnabled(resp));
      setIsBranchEnabled(false);
    }
  };

  const toggleDeliveron = () => {
    setDeliveronEnabled(data => !data);

    if(isDeliveronEnabled){
      console.log(deliveronChangeOptions);
      Request(deliveronChangeOptions).then(resp => setDeliveronEnabled(resp));
      setIsDeliveronEnabled(false);
    }
  };

  useEffect(() => {
    if(domain) {
      changeBranchStatus();
      deliveronStatus();
      changeDeliveronStatus();
      readLogout();
    }
  }, [domain])

  useEffect(() => {
    if(deliveronIsLoaded) {
      Request(deliveronOptions).then(resp => {
        setDeliveronEnabled(resp.status == 0 ? true : false);
      });
    }
  }, [deliveronIsLoaded])

  useEffect(() => {
    if(branches?.length > 0) {
      branches?.map(e => {
        if(e.value == branchid){
          if(e.enabled == 1) {
            setBranchEnabled(true);
          }else {
            setBranchEnabled(false);
          }
        }
      });
    }
  }, [branches, branchid])

  useEffect(() => {
    setOptions((prev) => ({...prev, data: { branchid: branchid, enabled: branchEnabled ? 0 : 1 }}));
    setIsBranchEnabled(true);
  }, [branchEnabled, branchid]);

  useEffect(() => {
    setDeliveronChangeOptions((prev) => ({...prev, data: {enabled: deliveronEnabled ? 0 : 1}}));
    setIsDeliveronEnabled(true);
  }, [deliveronEnabled])


  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerContent}>
        <LanguageSelector style={{paddingVertical: 10}}/>
        <Drawer.Section style={styles.drawerSection}>
          <DrawerItem
            icon={({ color, size }) => (
              <MaterialCommunityIcons
                name="cards-outline"
                color={color}
                size={size}
              />
            )}
            label={dictionary['nav.products']}
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
            label={dictionary['nav.onlineOrders']}
            onPress={() => {
              props.navigation.navigate("Orders", { screen: "Order" });
            }}
          />
          <DrawerItem
            icon={({ color, size }) => (
              <MaterialCommunityIcons
                name="logout"
                color={color}
                size={size}
              />
            )}
            label={dictionary.logout}
            onPress={onLogoutPressed}
          />
        </Drawer.Section>
        <Drawer.Section theme="dark">
          <TouchableRipple onPress={toggleDeliveron}>
            <View style={styles.preference}>
              <Text>{dictionary['dv.deliveron']}</Text>
              <View pointerEvents="none">
                <Switch value={deliveronEnabled} />
              </View>
            </View>
          </TouchableRipple>

          <TouchableRipple onPress={toggleBranch}>
            <View style={styles.preference}>
              <Text>{dictionary['orders.branch']}</Text>
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
