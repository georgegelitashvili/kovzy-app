import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    text: '#000000',
    primary: '#1E90FF', // DodgerBlue, a distinct color for the outline
    accent: '#f1c40f',
    error: '#f13a59',
    surface: '#FFFFFF', // White background for the input
    placeholder: '#A9A9A9', // DimGray for placeholder
    // Add other colors as needed
  },
};
