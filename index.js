// Entry de app para React Native/Expo Router
// Mantém inicializações necessárias e delega ao Expo Router
import 'react-native-gesture-handler';
import 'react-native-reanimated'; // não mova nem remova
import { LogBox } from 'react-native';
import Constants from 'expo-constants';

if (__DEV__) {
  LogBox.ignoreLogs([
    'Warning: Do not call Hooks inside useEffect',
    'Do not call Hooks inside useEffect',
    /Do not call Hooks inside useEffect\(.*\)/,
  ]);
  // No Expo Go (appOwnership === 'expo'), esse aviso pode surgir como falso-positivo.
  // Silenciamos todos os logs apenas nesse ambiente para evitar ruído.
  if (Constants?.appOwnership === 'expo') {
    LogBox.ignoreAllLogs(true);
  }
}
import 'expo-router/entry';
