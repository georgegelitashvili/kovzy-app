import React, { useState, useContext, useEffect, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { DrawerItem, DrawerContentScrollView } from "@react-navigation/drawer";
import { Drawer, Text, TouchableRipple, Switch } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ToggleTheme } from "../redux/Actions";
import { useDispatch, useSelector } from "react-redux";
import { storeData, getData } from '../helpers/storage';
import LanguageSelector from './generate/LanguageSelector';
import { Request } from "../axios/apiRequests";
import { String, LanguageContext } from './Language';

export default function DrawerContent(props) {
  const dispatch = useDispatch();
  const { branches } = useSelector((state) => state.branchesReducer);
  const { isdarkTheme } = useSelector((state) => state.themeReducer);
  const { dictionary } = useContext(LanguageContext);

  const [options, setOptions] = useState({}); // api options
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false); // check api options is loaded
  const [selected, setSelected] = useState(null);
  const [branchEnabled, setBranchEnabled] = useState(false);

  const switchDarkTheme = useCallback(() => {
    return isdarkTheme
      ? dispatch(ToggleTheme(false))
      : dispatch(ToggleTheme(true));
  });

  const onLogoutPressed = useCallback(() => {
    // removeData().then(() => console.log('Cleared'));
    props.navigation.navigate("Start", { screen: "Domain" });
  });

  const readDomain = async () => {
    await getData("domain").then(data => {
      setOptions({
        method: "POST",
        url: `https://${data.value}/api/branchActivity`
      });
      setOptionsIsLoaded(true);
    })
  };

  const readBranch = useCallback(async () => {
    try {
      await getData("branch").then(value => setSelected(value))
    } catch (e) {
      console.log('Failed to fetch the input from storage');
    }
  });

  const enabledBranch = () => {
    branches?.map(e => {
      if(e.value == selected){
        if(e.enabled == 1) {
          setBranchEnabled(true);
        }else {
          setBranchEnabled(false);
        }
      }
    });
  };


  const toggleBranch = () => {
    console.log(options);
    setBranchEnabled(data => !data);

    if(options){
      Request(options).then(resp => setBranchEnabled(resp));
    }
  };

  useEffect(() => {
    readBranch();
    readDomain();
    dispatch(ToggleTheme(isdarkTheme));
  }, [optionsIsLoaded]);

  useEffect(() => {
    if(options) {
      setOptions({...options, data: { branchid: selected,enabled: branchEnabled ? 0 : 1,}});
    }
  }, [selected, branchEnabled]);

  useEffect(() => {
    enabledBranch();
  }, [branches])


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
          <TouchableRipple onPress={() => {}}>
            <View style={styles.preference}>
              <Text>{dictionary['dv.deliveron']}</Text>
              <View pointerEvents="none">
                <Switch value={false} />
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
