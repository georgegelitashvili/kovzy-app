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

const Header = (props) => {
  const theme = useTheme();

  const { options } = props;
  const title =
    options.headerTitle !== undefined
      ? options.headerTitle
      : options.title !== undefined
        ? options.title
        : props.route.name;

  return (
    <Appbar.Header theme={{ colors: { primary: theme.colors.surface } }} style={{ marginTop: options.headerStyle?.marginTop }}>
      {props.back ? <Appbar.BackAction onPress={props.navigation.goBack} /> : null}
      <Appbar.Content
        title={title}
        titleStyle={{ fontSize: options.headerStyle?.fontSize }}
      />
    </Appbar.Header>
  );
};

export const HomeNavigator = () => {
  const { dictionary } = useContext(LanguageContext);
  return (
    <Stack.Navigator
      screenOptions={{
        headerMode: "screen",
        headerBackTitleVisible: false,
        header: (props) => <Header {...props} />,
      }}
    >
      <Stack.Screen name="Order" options={{ headerShown: false }}>
        {(props) => <Orders {...props} />}
      </Stack.Screen>

      <Stack.Screen name="Product" options={{ headerShown: false }}>
        {(props) => <Products {...props} />}
      </Stack.Screen>

      <Stack.Screen name="ProductsDetail" options={{
        headerTitle: dictionary["prod.customizable"],
        headerStyle: { marginTop: -65 },
        headerContentStyle: { fontSize: 10 }
      }}>
        {(props) => <ProductsDetail {...props} />}
      </Stack.Screen>

    </Stack.Navigator>
  );
};

export const AuthNavigator = () => {
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
    </Stack.Navigator>
  );
}
