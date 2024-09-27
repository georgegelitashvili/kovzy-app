import { DefaultTheme } from 'react-native-paper'
import Background from '../components/generate/Background'

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    text: '#000000',
    secondary: '#414757',
    error: '#f13a59',
    Background: '#fff',
  },
}
