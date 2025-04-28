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

  const apiUrls = useMemo(() => {
    if (!domain || domain === 'null' || domain === 'undefined' || domain === null) {
      console.warn('Invalid domain detected:', domain);
      return null;
    }
    
    try {
      const url = new URL(`https://${domain}`);
      return {
        login: `${url.origin}/api/v1/admin/auth/login`,
        logout: `${url.origin}/api/v1/admin/auth/logout`,
        branchStatus: `${url.origin}/api/v1/admin/branchStatus`,
        deliveronStatus: `${url.origin}/api/v1/admin/deliveronStatus`,
        authUser: `${url.origin}/api/v1/admin/auth/authorized`,
        languages: `${url.origin}/api/v1/admin/languages`
      };
    } catch (error) {
      console.error('Invalid domain URL:', error);
      return null;
    }
  }, [domain]);

  const { languages } = useFetchLanguages(apiUrls);

  const handleClick = useCallback(() => {
    setIsVisible(true);
  }, []);

  const readData = async () => {
    try {
      const data = await getMultipleData(["domain", "branch", "branchNames"]);
      const [domainValue, branchidValue, branchNameValue] = data;

      // Validate domain format
      const isValidDomain = domainValue && 
                           typeof domainValue === 'string' && 
                           domainValue !== 'null' && 
                           domainValue !== 'undefined' &&
                           domainValue.includes('.');

      if (isValidDomain && branchidValue && branchNameValue) {
        console.log('Domain validation passed:', domainValue);
        setDomain(domainValue);
        setBranchid(branchidValue);
        setBranchName(branchNameValue);
        setIsDataSet(true);
      } else {
        console.warn('Domain validation failed:', { 
          domainValue, 
          isValidDomain,
          branchidValue, 
          branchNameValue 
        });
        await cleanupData();
      }
    } catch (e) {
      console.error('Error reading data:', e);
      await cleanupData();
    }
  };

  const cleanupData = async () => {
    try {
      await Promise.all([
        deleteItem("token"),
        deleteItem("credentials"),
        deleteItem("user"),
        deleteItem("rcml-lang"),
        deleteItem("languages"),
        removeData(["domain", "branch", "branchNames"])
      ]);
    } catch (error) {
      console.error('Error cleaning up data:', error);
    } finally {
      setIsDataSet(false);
      setDomain(null);
      setBranchid(null);
      setBranchName(null);
      setUser(null);
      setUserObject(null);
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
    if (!domain || !branchid || !apiUrls?.deliveronStatus || !apiUrls?.branchStatus) {
      console.warn('Missing required data for fetchData:', { domain, branchid });
      return;
    }

    try {
      const [deliveronResponse, branchResponse] = await Promise.all([
        axiosInstance.post(apiUrls.deliveronStatus, { timeout: 5000 }),
        axiosInstance.post(apiUrls.branchStatus, { branchid }, { timeout: 5000 }),
      ]);

      const newDeliveronStatus = deliveronResponse?.data?.data?.status === 0;
      const newBranchStatus = branchResponse?.data?.data === true;

      setDeliveronEnabled(newDeliveronStatus);
      setBranchEnabled(newBranchStatus);
      setIsVisible(!newBranchStatus);
      setIsInitialFetch(false);

    } catch (error) {
      console.error('Error fetching status:', {
        message: error.message,
        domain,
        branchid,
        status: error.response?.status
      });
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setShowReload(true);
      setBranchEnabled(false);
      setIsVisible(true);
      setIsInitialFetch(false);

      // Handle 401 unauthorized error
      if (error.response?.status === 401) {
        setUser(null);
        await deleteItem("token");
        await deleteItem("credentials");
        await deleteItem("user");
      }
    }
  }, [domain, branchid, apiUrls, deleteItem]);

  const loadUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const userObj = await getSecureData('user');
      if (userObj && apiUrls?.authUser) {
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
  }, [apiUrls?.authUser]);

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
    const initializeData = async () => {
      if (!isConnected) {
        console.log('No internet connection, skipping initialization');
        return;
      }

      await readData();
    };

    initializeData();
  }, [isConnected]);

  // Add a retry mechanism for language fetching
  useEffect(() => {
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;

    const fetchLanguagesWithRetry = async () => {
      if (!apiUrls) {
        console.warn('No valid API URLs available, skipping language fetch');
        return;
      }

      try {
        if (languages.length > 0) {
          const defaultLanguage = languages.find(language => language.default === 1);
          if (defaultLanguage) {
            userLanguageChange(defaultLanguage.lang);
            await storeData('rcml-lang', defaultLanguage.lang);
            await storeData('languages', languages);
          }
        }
      } catch (error) {
        console.error('Error processing languages:', error);
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`Retrying language fetch (${retryCount}/${MAX_RETRIES})...`);
          setTimeout(fetchLanguagesWithRetry, RETRY_DELAY);
        } else {
          console.error('Max retries reached for language fetch');
        }
      }
    };

    fetchLanguagesWithRetry();
  }, [languages, apiUrls, userLanguageChange]);

  useEffect(() => {
    if (!apiUrls?.deliveronStatus || !apiUrls?.branchStatus) return;

    fetchData();
    startInterval();

    const handleAppStateChange = (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        fetchData();
        startInterval();
        if (!user && isConnected && apiUrls?.authUser) {
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
    if (!user && apiUrls?.authUser && isConnected) {
      loadUser();
    }
  }, [user, apiUrls?.authUser, isConnected]);

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
