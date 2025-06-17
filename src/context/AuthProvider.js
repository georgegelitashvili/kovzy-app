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
import eventEmitter from "../utils/EventEmitter";

export const AuthContext = createContext();

export const AuthProvider = ({ isConnected, children }) => {
  const [user, setUser] = useState(null);
  const [userObject, setUserObject] = useState(null);
  const [domain, setDomain] = useState(null);
  const [branchid, setBranchid] = useState(null);
  const [branchName, setBranchName] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataSet, setIsDataSet] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [branchEnabled, setBranchEnabled] = useState(false);
  const [deliveronEnabled, setDeliveronEnabled] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [showReload, setShowReload] = useState(false);
  const [isInitialFetch, setIsInitialFetch] = useState(true);

  const intervalRef = useRef(null);
  const { userLanguageChange, dictionary } = useContext(LanguageContext);

  const readData = async () => {
    try {
      const [domainValue, branchValue, branchNames] = await getMultipleData(['domain', 'branch', 'branchNames']);
      if (domainValue) setDomain(domainValue);
      if (branchValue) setBranchid(branchValue);
      if (branchNames) setBranchName(branchNames);
    } catch (error) {
      console.error('Error reading data:', error);
      handleError(error, 'READ_DATA_ERROR');
    }
  };

  const startInterval = () => {
    stopInterval();
    intervalRef.current = setInterval(fetchData, 10000);
  };

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const clearErrors = useCallback(() => {
    setLoginError(null);
    setError(null);
  }, []);
  const handleError = useCallback((error, type = 'UNKNOWN') => {
    const errorMessage = error?.message || dictionary?.['errors.UNKNOWN'];
    setError({ type, message: errorMessage });
    eventEmitter.emit('apiError', { type, message: errorMessage });
  }, [dictionary]);

  const cleanupAuth = useCallback(async () => {
    try {
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
      clearErrors();
    } catch (error) {
      console.error('Error cleaning up auth data:', error);
      handleError(error, 'CLEANUP_ERROR');
    }
  }, [clearErrors, handleError]);

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

  const login = useCallback(async (username, password) => {
    clearErrors();
    setIsLoading(true);
    try {
      const response = await axiosInstance.post(apiUrls?.login, { password, username });
      const { token: authorized, user } = response.data;

      if (!authorized || !user) {
        throw new Error(dictionary?.['errors.LOGIN_FAILED']);
      }

      const userResponse = {
        token: authorized,
        id: user.id,
        username: user.username,
      };

      await Promise.all([
        SecureStore.setItemAsync('credentials', JSON.stringify({ username, password })),
        SecureStore.setItemAsync('token', JSON.stringify(authorized)),
        SecureStore.setItemAsync('user', JSON.stringify(userResponse))
      ]);

      setUser(userResponse);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setLoginError(errorMessage);
      handleError(error, 'LOGIN_ERROR');
    } finally {
      setIsLoading(false);
    }
  }, [apiUrls, dictionary, handleError, clearErrors]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      if (apiUrls?.logout) {
        await axiosInstance.post(apiUrls.logout);
      }
      await cleanupAuth();
    } catch (error) {
      console.error('Error logging out:', error);
      handleError(error, 'LOGOUT_ERROR');
    } finally {
      setIsLoading(false);
    }
  }, [apiUrls, cleanupAuth, handleError]);

  const deleteItem = useCallback(async (key) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.log('Error deleting secure storage:', error);
    }
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const [credentials, token] = await Promise.all([
        getSecureData('credentials'),
        getSecureData('token')
      ]);

      if (credentials && token) {
        const { username, password } = credentials;
        await login(username, password);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      handleError(error, 'LOAD_USER_ERROR');
    }
  }, [login, handleError]);

  const fetchData = useCallback(async () => {
    if (!domain || !branchid || !apiUrls?.deliveronStatus || !apiUrls?.branchStatus) {
      console.warn('Missing required data for fetchData:', { 
        hasDomain: !!domain, 
        hasBranchId: !!branchid,
        hasDeliveronStatus: !!apiUrls?.deliveronStatus,
        hasBranchStatus: !!apiUrls?.branchStatus
      });
      return;
    }

    const MAX_RETRIES = 5;
    const RETRY_DELAY = 2000;
    let retryCount = 0;

    const attemptFetch = async () => {
      try {
        const [deliveronResponse, branchResponse] = await Promise.all([
          axiosInstance.post(apiUrls.deliveronStatus),
          axiosInstance.post(apiUrls.branchStatus, { branchid }),
        ]);

        // console.log('Status responses:', {
        //   deliveron: deliveronResponse?.data,
        //   branch: branchResponse?.data
        // });

        const deliveronData = deliveronResponse?.data?.data;
        const branchData = branchResponse?.data?.data;

        if ([deliveronData, branchData].some(item => item == null)) {
          console.warn('Invalid response data:', {
            deliveronData,
            branchData
          });
          throw new Error('Invalid response data');
        }

        const newDeliveronStatus = deliveronResponse?.data?.data?.status === 0;
        const newBranchStatus = branchResponse?.data?.data === true;

        setDeliveronEnabled(newDeliveronStatus);
        setBranchEnabled(newBranchStatus);
        setIsVisible(!newBranchStatus);
        setIsInitialFetch(false);
        setShowReload(false);

        retryCount = 0;

      } catch (error) {
        const errorResponse = error.response?.data;
        const errorStatus = error.response?.status;
        
        console.error('Error fetching status:', {
          message: error.message,
          domain,
          branchid,
          status: errorStatus,
          retry: retryCount + 1,
          responseData: errorResponse,
          errorDetails: error.toString()
        });

        if (errorStatus === 401) {
          console.log('Unauthorized access, clearing credentials...');
          setUser(null);
          await deleteItem("token");
          await deleteItem("credentials");
          await deleteItem("user");
          return;
        }

        if (errorResponse?.branch?.data === false) {
          console.warn('Branch is disabled, setting branchEnabled to false');
          setBranchEnabled(false);
          setIsVisible(true);
          setIsInitialFetch(false);
          return;
        }

        if (!errorStatus || errorStatus >= 500 || error.code === 'ECONNREFUSED') {
          if (retryCount < MAX_RETRIES) {
            const delay = RETRY_DELAY * Math.pow(2, retryCount);
            retryCount++;
            console.log(`Retrying... Attempt ${retryCount} of ${MAX_RETRIES} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return attemptFetch();
          }
        }

        console.warn('Max retries reached but keeping previous branch state');
        setShowReload(true);
        setIsInitialFetch(false);
      }
    };

    await attemptFetch();
  }, [domain, branchid, apiUrls, deleteItem, branchEnabled]);

  useEffect(() => {
    const sessionExpiredListener = eventEmitter.addEventListener('sessionExpired', () => {
      cleanupAuth();
      handleError({ message: dictionary?.['errors.SESSION_EXPIRED'] }, 'SESSION_EXPIRED');
    });

    return () => {
      eventEmitter.removeEventListener(sessionExpiredListener);
    };
  }, [cleanupAuth, handleError, dictionary]);

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

  useEffect(() => {
    let retryCount = 0;
    const MAX_RETRIES = 5;
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
    error,
    clearErrors,
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
    login,
    logout,
    deleteItem,
    languages
  }), [
    domain, user, loginError, error, isLoading, branchid, branchName,
    branchEnabled, deliveronEnabled, login, logout, deleteItem,
    languages, clearErrors
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {error && (
        <TouchableOpacity onPress={() => clearErrors()}>
          <Toast
            type="failed"
            title={dictionary?.["info.warning"]}
            subtitle={error.message}
            animate={true}
          />
        </TouchableOpacity>
      )}
      {isLoading ? (
        <Loader text={dictionary?.["loading"]} />
      ) : (
        children
      )}
      {user && (
        <AppUpdates 
          onError={(error) => handleError(error, 'UPDATE_ERROR')}
          showLogs={false}
          playStoreUrl="https://play.google.com/store/apps/details?id=com.kovzy.app"
        />
      )}
      {!branchEnabled && user && isVisible && (
        <TouchableOpacity onPress={() => setIsVisible(true)}>
          <Toast
            type="failed"
            title={dictionary?.["info.warning"]}
            subtitle={dictionary?.["orders.branchEnabled"]}
            animate={false}
          />
        </TouchableOpacity>
      )}
    </AuthContext.Provider>
  );
};
