import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AppState, TouchableOpacity } from 'react-native';
import axiosInstance from "../apiConfig/apiRequests";
import * as SecureStore from 'expo-secure-store';
import { storeData, getSecureData, removeData, getMultipleData } from "../helpers/storage";
import Toast from '../components/generate/Toast';
import { useFetchLanguages } from "../components/UseFetchLanguages";
import { LanguageContext } from "../components/Language";
import Loader from "../components/generate/loader";
import AppUpdates from "../components/AppUpdates";

export const AuthContext = createContext();

export const AuthProvider = ({ isConnected, children }) => {
  const [user, setUser] = useState(null);
  const [userObject, setUserObject] = useState(null);
  const [domain, setDomain] = useState(null);
  const [branchid, setBranchid] = useState(null);
  const [branchName, setBranchName] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataSet, setIsDataSet] = useState(false);
  const [loginError, setLoginError] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [branchEnabled, setBranchEnabled] = useState(false);
  const [deliveronEnabled, setDeliveronEnabled] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [shouldRenderAuthScreen, setShouldRenderAuthScreen] = useState(false);
  const [showReload, setShowReload] = useState(false);
  const [isInitialFetch, setIsInitialFetch] = useState(true);

  const intervalRef = useRef(null);
  const { userLanguageChange, dictionary } = useContext(LanguageContext);
  const { languages } = useFetchLanguages(domain);

  const apiUrls = useMemo(() => ({
    login: domain ? `https://${domain}/api/v1/admin/auth/login` : "",
    logout: domain ? `https://${domain}/api/v1/admin/auth/logout` : "",
    branchStatus: domain ? `https://${domain}/api/v1/admin/branchStatus` : "",
    deliveronStatus: domain ? `https://${domain}/api/v1/admin/deliveronStatus` : "",
    authUser: domain ? `https://${domain}/api/v1/admin/auth/authorized` : "",
  }), [domain]);

  const handleClick = useCallback(() => {
    setIsVisible(true);
  }, []);

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

  const deleteItem = useCallback(async (key) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.log('Error deleting secure storage:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!domain || !branchid || !apiUrls.deliveronStatus || !apiUrls.branchStatus) return;

    try {
      const [deliveronResponse, branchResponse] = await Promise.all([
        axiosInstance.post(apiUrls.deliveronStatus, { timeout: 5000 }),
        axiosInstance.post(apiUrls.branchStatus, { branchid }, { timeout: 5000 }),
      ]);

      const newDeliveronStatus = deliveronResponse.data.data.status === 0;
      const newBranchStatus = branchResponse.data.data === true;

      console.log('ფილიალის სტატუსი:', newBranchStatus);

      setDeliveronEnabled(newDeliveronStatus);
      setBranchEnabled(newBranchStatus);
      
      setIsVisible(!newBranchStatus);
      setIsInitialFetch(false);

    } catch (error) {
      console.error('შეცდომა მონაცემების მიღებისას:', error.message || error);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setShowReload(true);
      setBranchEnabled(false);
      setIsVisible(true);
      setIsInitialFetch(false);
    }
  }, [domain, branchid, apiUrls]);

  const loadUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const userObj = await getSecureData('user');
      if (userObj && apiUrls.authUser) {
        const response = await axiosInstance.get(apiUrls.authUser);
        if (response.data.user) {
          setUser(userObj);
        } else {
          setUser(null);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user:', error.message || error);
      setUser(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setShowReload(true);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrls.authUser]);

  const startInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(fetchData, 3000);
  }, [fetchData]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      await new Promise((res) => setTimeout(res, 500)); // 500ms delay before fetching
      await readData();
    };

    fetchData();
  }, [domain]);

  useEffect(() => {
    if (languages.length > 0) {
      const defaultLanguage = languages.find(language => language.default === 1);
      if (defaultLanguage) {
        userLanguageChange(defaultLanguage.lang);
        storeData('rcml-lang', defaultLanguage.lang);
        storeData('languages', languages);
      }
    }
  }, [languages]);

  useEffect(() => {
    if (!apiUrls.deliveronStatus || !apiUrls.branchStatus) return;
    
    fetchData();
    startInterval();

    const handleAppStateChange = (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        fetchData();
        startInterval();
        if (!user && isConnected && apiUrls.authUser) {
          loadUser();
        }
      } else {
        stopInterval();
      }
      setAppState(nextAppState);
    };

    const subscribe = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      stopInterval();
      subscribe.remove();
    };
  }, [appState, apiUrls, isConnected, user]);

  useEffect(() => {
    if (!user && apiUrls.authUser && isConnected) {
      loadUser();
    }
  }, [user, apiUrls.authUser, isConnected]);

  const contextValue = useMemo(() => ({
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
    shouldRenderAuthScreen,
    setShouldRenderAuthScreen,
    languages,
    login: async (username, password) => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.post(apiUrls.login, { password, username });
        const { token: authorized, user } = response.data;

        if (response.error) {
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
        await Promise.all([
          SecureStore.setItemAsync('credentials', JSON.stringify({ username, password })),
          SecureStore.setItemAsync('token', JSON.stringify(authorized)),
          SecureStore.setItemAsync('user', JSON.stringify(userResponse))
        ]);
      } catch (error) {
        console.log('Error logging in:', error);
        setLoginError('An error occurred while logging in. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    logout: async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.post(apiUrls.logout);
        if (response.data.message) {
          await Promise.all([
            deleteItem("token"),
            deleteItem("credentials"),
            deleteItem("user"),
            deleteItem("rcml-lang"),
            deleteItem("languages"),
            removeData(["domain", "branch", "branchNames"])
          ]);
          
          setDomain(null);
          setBranchid(null);
          setBranchName(null);
          setIsDataSet(false);
          setUser(null);
          setUserObject(null);
        }
      } catch (error) {
        console.log('Error logging out:', error);
        await Promise.all([
          deleteItem("token"),
          deleteItem("credentials"),
          deleteItem("user"),
          deleteItem("rcml-lang"),
          deleteItem("languages"),
          removeData(["domain", "branch", "branchNames"])
        ]);
        
        setDomain(null);
        setBranchid(null);
        setBranchName(null);
        setIsDataSet(false);
        setUser(null);
        setUserObject(null);
      } finally {
        setIsLoading(false);
      }
    },
  }), [
    domain, user, loginError, isLoading, branchid, branchName, branchEnabled,
    deliveronEnabled, deleteItem, shouldRenderAuthScreen, languages, apiUrls
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {!isConnected && !user && showReload && (
        <TouchableOpacity onPress={handleClick}>
          <Toast
            type="failed"
            title={dictionary["info.warning"]}
            subtitle={dictionary["orders.branchEnabled"]}
            animate={false}
          />
        </TouchableOpacity>
      )}

      {isLoading ? (
        <Loader text={dictionary["loading"]} />
      ) : (
        children
      )}

      {user && <AppUpdates />}

      {!branchEnabled && user && isVisible && (
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
