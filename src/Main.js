import React from "react";

import {
  NavigationContainer,
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import {
  MD3DarkTheme as PaperDarkTheme,
  MD3LightTheme as PaperDefaultTheme,
  Provider as PaperProvider,
} from 'react-native-paper';

import { useDispatch, useSelector } from "react-redux";
import RootNavigator from "./RootNavigator";

const CombinedDefaultTheme = {
  ...PaperDefaultTheme,
  ...NavigationDefaultTheme,
  colors: {
    ...PaperDefaultTheme.colors,
    ...NavigationDefaultTheme.colors,
  },
};
const CombinedDarkTheme = { 
  ...PaperDarkTheme, 
  ...NavigationDarkTheme,
  colors: {
    ...PaperDarkTheme.colors,
    ...NavigationDarkTheme.colors,
  },
};


export default function Main() {
  const { isdarkTheme } = useSelector((state) => state.themeReducer);
  const themeMode = isdarkTheme ? CombinedDarkTheme : CombinedDefaultTheme;

  return (
  <PaperProvider theme={themeMode}>
    <NavigationContainer theme={themeMode}>
      <RootNavigator />
    </NavigationContainer>
  </PaperProvider> 
  );
};
