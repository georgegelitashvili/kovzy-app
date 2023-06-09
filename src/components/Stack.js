import React, { useState, useEffect, TouchableOpacity } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { Appbar, useTheme } from "react-native-paper";
import { Platform } from 'react-native';
import { FontAwesome } from "@expo/vector-icons";

import LanguageSelector from './generate/LanguageSelector';
import { DomainScreen } from "../startScreens/DomainScreen";
import { BranchScreen } from "../startScreens/BranchScreen";
import { LoginScreen } from "../startScreens/LoginScreen";
import Orders from "../Orders";
import Products from "../Products";

const Stack = createStackNavigator();
const MORE_ICON = Platform.OS === 'ios' ? 'dots-horizontal' : 'dots-vertical';

const Header = (props) =>
{
  const theme = useTheme();
  const [showLang, setShowLang] = useState(false);

  const openMenu = () => setShowLang(true);

  const closeMenu = () => setVisible(false);

  const { options } = props;
  const title =
    options.headerTitle !== undefined
      ? options.headerTitle
      : options.title !== undefined
      ? options.title
      : props.route.name;

  return (
    <Appbar.Header theme={{ colors: { primary: theme.colors.surface } }}>
      {props.back ? <Appbar.BackAction onPress={props.navigation.goBack} /> : null}
      <Appbar.Content
      title={
        props.back ? title : null
      } />
    </Appbar.Header>
  );
};

export default function StackNavigator () {
  return (
    <Stack.Navigator
      screenOptions={{
        headerMode: "screen",
        header: (props) => <Header {...props} />,
      }}
    >
      <Stack.Screen name="Domain" options={{ headerShown: false }} component={DomainScreen} />
      <Stack.Screen name="Branch" component={BranchScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Order" options={{ headerShown: false }}>
        {(props) => <Orders {...props} />}
      </Stack.Screen>

      <Stack.Screen name="Product" options={{ headerShown: false }}>
        {(props) => <Products {...props} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};
