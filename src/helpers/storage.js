import AsyncStorage from "@react-native-async-storage/async-storage";

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

    // getting data from Async Storage
export const getMultipleData = async (keys) => {
  try {
    const savedValues = await AsyncStorage.multiGet(keys);
    return savedValues.map(([key, value]) => JSON.parse(value));
  } catch (e) {
    console.log(e.message);
    throw e; // Re-throw the error to propagate it to the calling code
  }
};

  // remove all data from Async Storage
  export const removeData = async (key) => {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (e) {
      console.log(e.message);
      return false;
    }
  };