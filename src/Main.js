import React from "react";
import {
  NavigationContainer,
} from '@react-navigation/native';
import {
  Provider as PaperProvider,
} from 'react-native-paper';

import { AuthProvider } from "./context/AuthProvider";
import { LanguageProvider } from './components/Language';
import { navigationRef } from './helpers/navigate';

import RootNavigator from "./RootNavigator";

export default function Main() {
  return (
    <LanguageProvider>
      
      <PaperProvider>

        <AuthProvider>

          <NavigationContainer ref={navigationRef}>
            <RootNavigator />
          </NavigationContainer>
          
        </AuthProvider>

      </PaperProvider>
      
    </LanguageProvider>
  );
};
