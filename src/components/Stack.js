import React, { useContext } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { Appbar, useTheme } from "react-native-paper";

import { LanguageContext } from "./Language";
import { DomainScreen } from "../startScreens/DomainScreen";
import { BranchScreen } from "../startScreens/BranchScreen";
import { LoginScreen } from "../startScreens/LoginScreen";
import Orders from "../Orders";
import QrOrders from "../QrOrders";
import Products from "../Products";
import Reports from "../Reports";
import ProductsDetail from "./products/ProductsDetail";
import SettingsScreen from '../SettingsScreen';
import NotificationScreen from './settings/NotificationScreen';

const Stack = createStackNavigator();

const Header = ({ options, navigation, route }) => {
  const theme = useTheme();
  const headerStyle = options?.headerStyle;
  const title = options?.headerTitle ?? options?.title ?? route?.name;

  return (
    <Appbar.Header
      theme={{ colors: { primary: theme.colors.surface } }}
      style={{ marginTop: headerStyle?.marginTop, backgroundColor: 'white' }}>
      {navigation?.canGoBack() ? (
        <Appbar.BackAction onPress={navigation.goBack} />
      ) : (
        <Appbar.Action icon="menu" onPress={() => navigation.toggleDrawer()} />
      )}
      <Appbar.Content
        title={title}
        titleStyle={{ fontSize: headerStyle?.fontSize, fontWeight: 'bold' }}
      />
    </Appbar.Header>
  );
};

export const AuthNavigator = () => {
  const { dictionary, userLanguage } = useContext(LanguageContext);

  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        headerMode: 'screen',
        header: (props) => {
          const { key, ...otherProps } = props;
          return <Header {...otherProps} />;
        },
        ...route.params?.options,
        ...route.params?.options, // Pass route params as options
      })}
    >
      <Stack.Screen
        name="Domain"
        options={{
          headerTitle: dictionary["domains.addDomain"],
          unmountOnBlur: true
        }}
        component={DomainScreen}
      />
      <Stack.Screen
        name="Branch"
        options={{
          headerTitle: dictionary["branches.branches"],
          unmountOnBlur: true
        }}
        component={BranchScreen}
      />
      <Stack.Screen
        name="Login"
        options={{
          headerTitle: dictionary["nav.auth"],
          unmountOnBlur: true
        }}
        component={LoginScreen}
      />
    </Stack.Navigator>
  );
}

export const OrdersNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        headerMode: "screen",
        headerBackTitleVisible: false,
        header: (props) => {
          const { key, ...otherProps } = props; // Destructure key from props
          return <Header {...otherProps} />; // Spread otherProps without key
        },
        ...route.params?.options, // Pass route params as options
      })}
    >
      <Stack.Screen name="Order" options={{ headerShown: false, unmountOnBlur: true }} component={Orders} />
    </Stack.Navigator>
  );
};

export const QrOrdersNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        headerMode: "screen",
        headerBackTitleVisible: false,
        header: (props) => <Header {...props} navigation={navigation} route={route} />,
        ...route.params?.options,
      })}
    >
      <Stack.Screen 
        name="QrOrdersScreen"
        options={{ 
          headerShown: false,
          unmountOnBlur: true 
        }} 
        component={QrOrders} 
      />
    </Stack.Navigator>
  );
};

export const ReportsNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        headerMode: "screen",
        headerBackTitleVisible: false,
        header: (props) => {
          const { key, ...otherProps } = props;
          return <Header {...otherProps} />;
        },
        ...route.params?.options,
      })}
    >
      <Stack.Screen 
        name="ReportsScreen" 
        options={{ headerShown: false, unmountOnBlur: true }} 
        component={Reports} 
      />
    </Stack.Navigator>
  );
}

export const ProductsNavigator = () => {
  const { dictionary } = useContext(LanguageContext);

  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        headerMode: "screen",
        headerBackTitleVisible: false,
        header: (props) => {
          const { key, ...otherProps } = props; // Destructure key from props
          return <Header {...otherProps} />; // Spread otherProps without key
        },
        ...route.params?.options, // Pass route params as options
      })}
    >
      <Stack.Screen name="Product" options={{ headerShown: false, unmountOnBlur: true }} component={Products} />
      <Stack.Screen
        name="ProductsDetail"
        component={ProductsDetail}
        options={({ route }) => ({
          headerTitle: dictionary["prod.customizable"],
          headerStyle: { marginTop: 0 },
          headerContentStyle: { fontSize: 10 },
          unmountOnBlur: true,
          ...route.params?.options, // Pass route params as options
        })}
      />
    </Stack.Navigator>
  );
};

export const SettingsNavigator = () => {
  const { dictionary } = useContext(LanguageContext);

  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => {
        const { key, ...options } = route.params?.options || {}; // Exclude key prop
        return {
          headerMode: "screen",
          headerBackTitleVisible: false,
          header: (props) => {
            const { key, ...otherProps } = props; // Destructure key from props
            return <Header {...otherProps} />; // Spread otherProps without key
          },
          ...options, // Pass route params as options without key
        };
      }}
    >
      <Stack.Screen
        name="Setting"
        options={{ headerShown: false, unmountOnBlur: true }}
        component={SettingsScreen}
      />
      <Stack.Screen
        name="MusicList"
        options={({ route }) => {
          const { key, ...options } = route.params?.options || {}; // Exclude key prop
          return {
            headerTitle: dictionary['sound'],
            headerStyle: { marginTop: 0 },
            headerContentStyle: { fontSize: 10 },
            unmountOnBlur: true,
            ...options, // Pass route params as options without key
          };
        }}
        component={NotificationScreen}
      />
    </Stack.Navigator>
  );
};