import React, { useContext } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { Appbar, useTheme } from "react-native-paper";

import { AuthContext } from "../context/AuthProvider";
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
  const { headerStyle } = options;
  const title = options.headerTitle ?? options.title ?? navigation?.route?.name;

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


export const HomeNavigator = ({ navigation }) => {
  const { shouldRenderAuthScreen } = useContext(AuthContext);
  const { dictionary } = useContext(LanguageContext);

  if (shouldRenderAuthScreen) {
    console.log("stack navigator: ", shouldRenderAuthScreen);
    return (
      <Stack.Navigator
        screenOptions={{
          headerMode: "screen",
          header: (props) => <Header {...props} />,
        }}>
        <Stack.Screen
          name="Auth"
          component={LoginScreen}
          listeners={({ navigation }) => ({
            beforeRemove: (e) => {
              e.preventDefault();
              navigation.navigate("Login");
            },
          })}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    );
  }

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
      <Stack.Screen
        name="ProductsDetail"
        options={{
          headerTitle: dictionary["prod.customizable"],
          headerStyle: { marginTop: -65 },
          headerContentStyle: { fontSize: 10 },
        }}
      >
        {(props) => <ProductsDetail {...props} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};
