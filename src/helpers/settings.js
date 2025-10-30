import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Settings utility functions for managing app settings
 */

/**
 * Get the show cancel button setting from AsyncStorage
 * @returns {Promise<boolean>} True if cancel button should be shown, false otherwise
 */
export const getShowCancelButtonSetting = async () => {
  try {
    const storedValue = await AsyncStorage.getItem('showCancelButton');
    if (storedValue !== null) {
      return JSON.parse(storedValue);
    }
    // Default to false if no setting is stored
    return false;
  } catch (error) {
    console.error('Failed to load cancel button setting:', error);
    // Default to false on error
    return false;
  }
};

/**
 * Set the show cancel button setting in AsyncStorage
 * @param {boolean} show - Whether to show the cancel button
 * @returns {Promise<void>}
 */
export const setShowCancelButtonSetting = async (show) => {
  try {
    await AsyncStorage.setItem('showCancelButton', JSON.stringify(show));
  } catch (error) {
    console.error('Failed to save cancel button setting:', error);
  }
};

/**
 * Get the postpone order setting from AsyncStorage
 * @returns {Promise<boolean>} True if postpone order should be shown, false otherwise
 */
export const getPostponeOrderSetting = async () => {
  try {
    const storedValue = await AsyncStorage.getItem('postponeOrderShow');
    if (storedValue !== null) {
      return JSON.parse(storedValue);
    }
    // Default to false if no setting is stored
    return false;
  } catch (error) {
    console.error('Failed to load postpone order setting:', error);
    // Default to false on error
    return false;
  }
};
