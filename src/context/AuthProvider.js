import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { AppState, TouchableOpacity, Alert } from 'react-native';
import axiosInstance from "../apiConfig/apiRequests";
import * as SecureStore from 'expo-secure-store';
import { storeData, getSecureData, removeData, getMultipleData } from "../helpers/storage";
import Toast from '../components/generate/Toast';
import { useFetchLanguages } from "../components/UseFetchLanguages";
import { LanguageContext } from "../components/Language";
import Loader from "../components/generate/loader";

export const AuthContext = createContext();

export const AuthProvider = ({ isConnected, children }) => {
  const [user, setUser] = useState(null);
  const [userObject, setUserObject] = useState(null);
  const [domain, setDomain] = useState(null);
  const [previousDomain, setPreviousDomain] = useState(null);
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
  const [showReload, setShowReload] = useState(false);

  const { userLanguageChange, dictionary } = useContext(LanguageContext);

  const { languages } = useFetchLanguages(domain);

  const handleLanguageChange = e => userLanguageChange(e);

  const handleClick = () => {
    setIsVisible(true);
  };

  const readData = async () => {
    try {
      const data = await getMultipleData(["domain", "branch", "branchNames"]);
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
        axiosInstance.post(options.url_deliveronStatus, { timeout: 5000 }),
        axiosInstance.post(options.url_branchStatus, { branchid }, { timeout: 5000 }),
      ]);

      setDeliveronEnabled(deliveronResponse.data.data.status === 0);
      setBranchEnabled(branchResponse.data.data);
      setIsVisible(branchResponse.data.data);
    } catch (error) {
      console.error('Error fetching data:', error.message || error);
      clearInterval(intervalId);
      setShowReload(true);
    }
  };

  const loadUser = async () => {
    setIsLoading(true);
    const userObj = await getSecureData('user');
    if (userObj && options.url_authUser) {
      console.log('object of user', userObj);
      setUserObject(userObj);
      await axiosInstance.get(options.url_authUser)
        .then(response => {
          if (response.data.user) {
            setUser(userObj);
          } else {
            setUser(null);
            clearInterval(intervalId);
            setIntervalId(null);
            setIsLoading(false);
          }
        })
        .catch(error => {
          console.error('Error loading user:', error.message || error);
          setUser(null);
          clearInterval(intervalId);
          setIntervalId(null);
          setShowReload(true);
          setIsLoading(false);
        });
    }
  };

  const startInterval = () => {
    const newIntervalId = setInterval(fetchData, 3000);
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
    stopInterval();
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
    if (!options || !options.url_deliveronStatus || !options.url_branchStatus) {
      console.error('Missing URL parameters in options');
      return;
    }
    
    fetchData();
    startInterval();

    const handleAppStateChange = (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        fetchData();
        startInterval();
        if (!user && isConnected && options.url_authUser != "") {
          loadUser();
        }
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
  }, [appState, domain, branchid, options, isConnected, user, branchEnabled, deliveronEnabled]);


  useEffect(() => {
    if (!user && options.url_authUser && isConnected) {
      loadUser();
    } else {
      setIsLoading(false);
    }
  }, [user, options, isConnected]);


  const handleReload = () => {
    setShowReload(false);  // Hide reload button on click
    fetchData();           // Reattempt data fetch
    loadUser();            // Reattempt to load user
  };

  return (
    <AuthContext.Provider
      value={{
        domain,
        setDomain,
        user,
        setUser,
        loginError,
        isLoading,
        setIsLoading,
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
            const response = await axiosInstance.post(options.url_logout);
            if (response.data.message) {
              deleteItem("token");
              deleteItem("credentials");
              deleteItem("user");
              removeData(["domain", "branch", "branchNames"]);
              setDomain(null);
              setBranchid(null);
              setBranchName(null);
              setIsDataSet(false);
              setUser(null);
              setIsLoading(false);
              setUserObject(null);
            }
          } catch (error) {-
            console.log('Error logging out:', error);
            deleteItem("token");
            deleteItem("credentials");
            deleteItem("user");
            deleteItem("rcml-lang");
            deleteItem("languages");
            removeData(["domain", "branch", "branchNames"]);
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

      {!isConnected && !user && showReload && (
        Alert.alert("ALERT", "connection lost", [
          {
            text: "retry", onPress: () => {
              setIsLoading(true);
              handleReload();
            }
          },
        ])
      )}

      {!user && userObject && isLoading ? (
        <Loader text={dictionary["loading"]} />
      ) : (
        children
      )}


      {!isVisible && user && (
        <TouchableOpacity onPress={handleClick}>
          <Toast
            type="failed"
            title={dictionary["info.warning"]}
            subtitle={dictionary["orders.branchEnabled"]}
            animate={false}
          />
        </TouchableOpacity>
      )}

    </AuthContext.Provider>
  );
};
