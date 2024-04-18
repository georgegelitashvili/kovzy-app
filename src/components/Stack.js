import React, { useContext } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { Appbar, useTheme } from "react-native-paper";

import { LanguageContext } from "./Language";
import { DomainScreen } from "../startScreens/DomainScreen";
import { BranchScreen } from "../startScreens/BranchScreen";
import { LoginScreen } from "../startScreens/LoginScreen";
import Orders from "../Orders";
import Products from "../Products";
import ProductsDetail from "./products/ProductsDetail";

const Stack = createStackNavigator();

const Header = ({ options, navigation }) => {
  const theme = useTheme();
  const headerStyle = options?.headerStyle;
  const title = options?.headerTitle ?? options?.title ?? navigation?.route?.name;

  return (
    <Appbar.Header theme={{ colors: { primary: theme.colors.surface } }} style={{ marginTop: headerStyle?.marginTop }}>
      {navigation?.canGoBack() ? <Appbar.BackAction onPress={navigation.goBack} /> : null}
      <Appbar.Content
        title={title}
        titleStyle={{ fontSize: headerStyle?.fontSize }}
      />
    </Appbar.Header>
  );
};

export const AuthNavigator = () => {
  const { dictionary } = useContext(LanguageContext);
  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        headerMode: "screen",
        header: (props) => <Header {...props} />,
        ...route.params?.options, // Pass route params as options
      })}
    >
      <Stack.Screen name="Domain" options={{ headerShown: true, headerTitle: dictionary["domains.addDomain"] }} component={DomainScreen} />
      <Stack.Screen name="Branch" options={{ headerTitle: dictionary["branches.branches"] }} component={BranchScreen} />
      <Stack.Screen name="Login" options={{ headerTitle: dictionary["nav.auth"] }} component={LoginScreen} />
    </Stack.Navigator>
  );
}

export const OrdersNavigator = () => {
  const { dictionary } = useContext(LanguageContext);

  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        headerMode: "screen",
        headerBackTitleVisible: false,
        header: (props) => <Header {...props}/>,
        ...route.params?.options, // Pass route params as options
      })}
    >
      <Stack.Screen name="Order" options={{ headerShown: false, unmountOnBlur: true }} component={Orders} />
    </Stack.Navigator>
  );
};

export const ProductsNavigator = () => {
  const { dictionary } = useContext(LanguageContext);

  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        headerMode: "screen",
        headerBackTitleVisible: false,
        header: (props) => <Header {...props}/>,
        ...route.params?.options, // Pass route params as options
      })}
    >
      <Stack.Screen name="Product" options={{ headerShown: false, unmountOnBlur: true }} component={Products} />
      <Stack.Screen
        name="ProductsDetail"
        component={ProductsDetail}
        options={({ route }) => ({
          headerTitle: dictionary["prod.customizable"],
          headerStyle: { marginTop: -65 },
          headerContentStyle: { fontSize: 10 },
          ...route.params?.options, // Pass route params as options
        })}
      />
    </Stack.Navigator>
  );
};
