import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { AppState } from 'react-native';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import axiosInstance from "../apiConfig/apiRequests";
import * as SecureStore from 'expo-secure-store';
import { storeData, getSecureData, removeData, getMultipleData } from "../helpers/storage";
import Toast from '../components/generate/Toast';
import { useFetchLanguages } from "../components/UseFetchLanguages";
import { LanguageContext } from "../components/Language";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [domain, setDomain] = useState(null);
  const [branchid, setBranchid] = useState(null);
  const [branchName, setBranchName] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataSet, setIsDataSet] = useState(false);
  const [options, setOptions] = useState({
    url_login: "",
    url_logout: "",
    url_branchStatus: "",
    url_deliveronStatus: "",
    url_authUser: ""
  });
  const [loginError, setLoginError] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const [branchEnabled, setBranchEnabled] = useState(false);
  const [deliveronEnabled, setDeliveronEnabled] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [appState, setAppState] = useState(AppState.currentState);
  const [shouldRenderAuthScreen, setShouldRenderAuthScreen] = useState(false);
  const [defaultLang, setDefaultLang] = useState(null);

  const { userLanguageChange, dictionary } = useContext(LanguageContext);

  const { languages } = useFetchLanguages(domain);

  const handleLanguageChange = e => userLanguageChange(e);

  const handleClick = () => {
    setIsVisible(true);
  };

  const readData = async () => {
    try {
      const data = await getMultipleData(["domain", "branch", "branchName"]);
      const [domain, branchid, branchName] = data;

      if (domain && branchid && branchName) {
        setDomain(domain);
        setBranchid(branchid);
        setBranchName(branchName);
        setIsDataSet(true);

      } else {
        setIsDataSet(false);
      }
    } catch (e) {
      console.log(e.message);
      // Handle error or set appropriate state
    }
  };

  const apiOptions = useCallback(() => {
    if (domain) {
      setOptions(prevOptions => ({
        ...prevOptions,
        url_login: `https://${domain}/api/v1/admin/auth/login`,
        url_logout: `https://${domain}/api/v1/admin/auth/logout`,
        url_branchStatus: `https://${domain}/api/v1/admin/branchStatus`,
        url_deliveronStatus: `https://${domain}/api/v1/admin/deliveronStatus`,
        url_authUser: `https://${domain}/api/v1/admin/auth/authorized`,
      }));
    }
  }, [domain, isDataSet]);

  const deleteItem = async (key) => {
    try {
      const result = await SecureStore.deleteItemAsync(key);
      if (result) {
        console.log(key + ': Secure storage item deleted successfully.');
      } else {
        console.log(key + ': Secure storage item does not exist.');
      }
    } catch (error) {
      console.log('Error occurred while deleting secure storage:', error);
    }
  };

  const fetchData = async () => {
    if (!domain || !branchid || !options) return;

    try {
      const [deliveronResponse, branchResponse] = await Promise.all([
        axiosInstance.post(options.url_deliveronStatus),
        axiosInstance.post(options.url_branchStatus, { branchid }),
      ]);

      setDeliveronEnabled(deliveronResponse.data.data.status === 0);
      setBranchEnabled(branchResponse.data.data);
      setIsVisible(branchResponse.data.data);
    } catch (error) {
      console.log('Error fetching data:', error);
      clearInterval(intervalId);
    }
  };

  const startInterval = () => {
    const newIntervalId = setInterval(fetchData, 5000);
    setIntervalId(newIntervalId);
  };

  const stopInterval = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  useEffect(() => {
    readData();
    apiOptions();
  }, [domain, isDataSet]);

  useEffect(() => {
    if (languages.length > 0) {
      const defaultLanguage = languages.find(language => language.default === 1);
      setDefaultLang(defaultLanguage ? defaultLanguage.lang : null);
      handleLanguageChange(defaultLanguage.lang);
      storeData('rcml-lang', defaultLanguage.lang);
      storeData('languages', languages);
    }
  }, [languages]);


  useEffect(() => {
    fetchData();
    startInterval();

    const handleAppStateChange = (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        fetchData();
        startInterval();
      } else {
        // App has gone to the background
        stopInterval();
      }

      setAppState(nextAppState);
    };

    const subscribe = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      stopInterval();
      subscribe.remove();
    };
  }, [domain, branchid, options]);


  useEffect(() => {
    const loadUser = async () => {
      const userObj = await getSecureData('user');
      console.log('object of user', userObj);

      try {
        if (userObj) {
          const response = await axiosInstance.get(options.url_authUser);
          console.log('check auth response data:', response.data);

          if (response.data.user) {
            setUser(userObj);
          } else {
            setUser(null);
            clearInterval(intervalId);
            setIntervalId(null);
          }
        }
      } catch (error) {
        console.error("Error loading user:", error);
        setUser(null);
        clearInterval(intervalId);
        setIntervalId(null);
      } finally {
        // Add a slight delay before hiding the loader
        setTimeout(() => {
          setIsLoading(false);
        }, 1500); // Adjust the delay time (in milliseconds) as needed
      }
    };

    if (options) {
      loadUser();
    } else {
      setIsLoading(false);
    }
  }, [domain, options]);


  return (
    <AuthContext.Provider
      value={{
        domain,
        setDomain,
        user,
        setUser,
        loginError,
        isLoading,
        setIsDataSet,
        branchid,
        setBranchid,
        branchName,
        branchEnabled,
        setBranchEnabled,
        deliveronEnabled,
        setDeliveronEnabled,
        deleteItem,
        intervalId,
        setIntervalId,
        shouldRenderAuthScreen,
        setShouldRenderAuthScreen,
        languages,
        login: async (username, password) => {
          setIsLoading(true);
          try {
            const response = await axiosInstance.post(options.url_login, { password, username });
            // return false;
            const error = response.error;
            // Accessing the value of authorized
            const authorized = response.data.token;
            const user = response.data.user;

            if (error) {
              setLoginError(response.error.message);
              return;
            }

            const userResponse = {
              token: authorized,
              id: user.id,
              username: user.username,
            };

            setUser(userResponse);
            setLoginError([]);
            SecureStore.setItemAsync('credentials', JSON.stringify({ username, password }));
            SecureStore.setItemAsync('token', JSON.stringify(authorized));
            SecureStore.setItemAsync('user', JSON.stringify(userResponse));
          } catch (error) {
            console.log('Error logging in:', error);
            setLoginError('An error occurred while logging in. Please try again.');
            setIsLoading(false);
          } finally {
            setIsLoading(false);
          }
        },
        logout: async () => {
          setIsLoading(true);
          try {
            const token = JSON.parse(await SecureStore.getItemAsync('token'));
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            await axiosInstance.post(options.url_logout);
            deleteItem("token");
            deleteItem("credentials");
            deleteItem("user");
            removeData(["domain", "branch", "branchName"]);
            setDomain(null);
            setBranchid(null);
            setBranchName(null);
            setIsDataSet(false);
            setUser(null);
            setIsLoading(false);
          } catch (error) {
            console.log('Error logging out:', error);
            deleteItem("token");
            deleteItem("credentials");
            deleteItem("user");
            deleteItem("rcml-lang");
            deleteItem("languages");
            removeData(["domain", "branch", "branchName"]);
            setDomain(null);
            setBranchid(null);
            setBranchName(null);
            setIsDataSet(false);
            setUser(null);
            setIsLoading(false);
          } finally {
            setIsLoading(false);
          }
        },
      }}
    >

      {children}

      {!isVisible && (
        <TouchableOpacity onPress={handleClick}>
          <Toast
            type="failed"
            title="Branch Error"
            subtitle={dictionary["orders.branchEnabled"]}
            animate={false}
          />
        </TouchableOpacity>
      )}

    </AuthContext.Provider>
  );
};
