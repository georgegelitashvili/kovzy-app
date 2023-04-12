import AsyncStorage from "@react-native-async-storage/async-storage";

// storing data into Async Storage
export const storeData = async (key, value) => {
    try {
      // console.log('-------------- store data');
      // console.log(key, value);
      // console.log('-------------- end store data');
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
    export const getMultipleData = async (key) => {
      try {
        const savedValue = await AsyncStorage.multiGet(key);
        const currentUser = savedValue;
        if (currentUser !== null) {
          return currentUser;
        }
      } catch (e) {
        console.log(e.message);
      }
    };

  // remove all data from Async Storage
  export const removeData = async () => {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.log(e.message);
    }
  };