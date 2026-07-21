import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';

// storing data into Async Storage
export const storeData = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.log(e.message);
    }
  };

  // getting data from Async Storage
  export const getData = async (key) => {
    try {
      const savedValue = await AsyncStorage.getItem(key);
      const currentUser = JSON.parse(savedValue);

      if (currentUser !== null) {
        return currentUser;
      }
    } catch (e) {
      console.log(e.message);
    }
};

  // getting data from secure Storage
  export const getSecureData = async (key) => {
    try {
      const savedValue = await SecureStore.getItemAsync(key);
      const currentUser = JSON.parse(savedValue);

      if (currentUser !== null) {
        return currentUser;
      }
    } catch (e) {
      console.log(e.message);
    }
  };

  // getting data from Async Storage
  export const getMultipleData = async (keys) => {
    try {
      const savedValues = await AsyncStorage.multiGet(keys);

      const parsedValues = savedValues.map(([key, value]) => {
        if (value === null || value === undefined) {
          console.warn(`⚠️ Value for key "${key}" not found in AsyncStorage`);
          return null;
        }

        try {
          return JSON.parse(value);
        } catch (parseError) {
          console.error(`❌ JSON parse error for key "${key}":`, parseError);
          return null;
        }
      });

      return parsedValues;
    } catch (e) {
      console.error('❌ Error reading multiple data:', e.message);
      throw e;
    }
    };

  // remove data from Async Storage
  export const removeData = async (keys) => {
    try {
      if (Array.isArray(keys)) {
        await AsyncStorage.multiRemove(keys);
        console.log(`Removed multiple keys: ${keys.join(', ')}`);
      } else {
        await AsyncStorage.removeItem(keys);
        console.log(`Removed key: ${keys}`);
      }
      return true;
    } catch (e) {
      console.log(`Error removing data:`, e.message);
      return false;
    }
  };
    