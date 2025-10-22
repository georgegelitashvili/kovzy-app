import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { AppState } from "react-native";
import * as SecureStore from 'expo-secure-store';
import axiosInstance from "../apiConfig/apiRequests";
import { storeData, getData, getSecureData, removeData } from "../helpers/storage";
import { domainValidator } from "../helpers/domainValidator";
import Toast from "../components/generate/Toast";
import { useFetchLanguages } from "../components/UseFetchLanguages";
import { LanguageContext } from "../components/Language";
import Loader from "../components/generate/loader";
import ErrorDisplay from "../components/generate/ErrorDisplay";
import useErrorDisplay from '../hooks/useErrorDisplay';
import AppUpdates from "../components/AppUpdates";
import eventEmitter from '../utils/EventEmitter';

export const AuthContext = createContext();

export const AuthProvider = ({ isConnected, children }) => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    console.log('[AuthProvider] user state changed:', user);
    
    // Handle logout navigation - when user becomes null and we just logged out
    if (!user && justLoggedOut) {
      console.log('[AuthProvider] User logged out, forcing error clear and navigation reset');
      
      // Force clear all errors immediately
      forceClearError();
      setError(null);
      
      // Emit navigation reset event
      eventEmitter.emit('resetToDomain');
      
      // Clear the justLoggedOut flag after a short delay to ensure navigation completes
      setTimeout(() => {
        setJustLoggedOut(false);
      }, 100);
    }
  }, [user, justLoggedOut, forceClearError, setError]);
  const didShowAuthToast = useRef(false);
  const didShowLoginErrorToast = useRef(false);
  // Suppress duplicate Network Error toast/logs
  const didShowNetworkErrorToast = useRef(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [justLoggedOut, setJustLoggedOut] = useState(false);
  const [domain, setDomain] = useState(null);
  const [branchid, setBranchid] = useState(null);
  const [branchName, setBranchName] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  // loginError state REMOVED, use only useErrorDisplay's error
  const [branchEnabled, setBranchEnabled] = useState(false);
  const [deliveronEnabled, setDeliveronEnabled] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [isVisible, setIsVisible] = useState(false);

  const isMounted = useRef(true);

  const { setAvailableLanguages, userLanguageChange, dictionary } = useContext(LanguageContext);

  // apiUrls always defined, but with nulls if domain is not set
  const apiUrls = useMemo(() => {
    if (!domain) {
      return {
        login: null,
        logout: null,
        branchStatus: null,
        deliveronStatus: null,
        authUser: null,
        languages: null,
      };
    }
    try {
      const url = new URL(`https://${domain}`);
      return {
        login: `${url.origin}/api/v1/admin/auth/login`,
        logout: `${url.origin}/api/v1/admin/auth/logout`,
        branchStatus: `${url.origin}/api/v1/admin/branchStatus`,
        deliveronStatus: `${url.origin}/api/v1/admin/deliveronStatus`,
        authUser: `${url.origin}/api/v1/admin/auth/authorized`,
        languages: `${url.origin}/api/v1/admin/languages`,
      };
    } catch {
      return {
        login: null,
        logout: null,
        branchStatus: null,
        deliveronStatus: null,
        authUser: null,
        languages: null,
      };
    }
  }, [domain]);

  // Always call hooks at top level, never conditionally
  const { languages } = useFetchLanguages(apiUrls);

  const {
    errorDisplay,
    error,
    setError,
    clearError,
    persistent
  } = useErrorDisplay();

  // Function to clear the justLoggedOut flag (called when user starts fresh)
  const clearJustLoggedOut = useCallback(() => {
    setJustLoggedOut(false);
  }, []);

  // Force clear error, even if persistent
  const forceClearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const clearErrors = useCallback((forceClearPersistent = false) => {
    console.log('[AuthProvider] clearErrors called, forceClearPersistent:', forceClearPersistent);
    if (forceClearPersistent) {
      // Force clear all errors including persistent ones (used during logout)
      forceClearError();
    } else {
      clearError();
    }
  }, [clearError, forceClearError]);

  const handleError = useCallback(
    (errorParam, type = "UNKNOWN", options = {}) => {
      // Skip error handling during logout
      if (isLoggingOut) {
        console.log('[AuthProvider handleError] Skipping error handling during logout');
        return;
      }
      
      // Suppress errors of type LOGGED_OUT_SUPPRESS
      if (type === "LOGGED_OUT_SUPPRESS") {
        // No log for suppressed errors
        return;
      }
      let errorMessage;
      if (type === "LOGIN_ERROR") {
        errorMessage = dictionary?.["errors.LOGIN_FAILED"] || "მომხმარებელი ან პაროლი არასწორია";
      } else if (type === "SESSION_EXPIRED") {
        errorMessage = dictionary?.["errors.SESSION_EXPIRED"] || "Your session has expired. Please log in again.";
      } else if (errorParam?.message) {
        errorMessage = errorParam.message;
      } else {
        errorMessage = dictionary?.["errors.UNKNOWN"] || "Unknown error";
      }

      // Suppress duplicate Network Error logs/toasts
      if (
        type === "NETWORK_ERROR" ||
        (typeof errorMessage === "string" && errorMessage.toLowerCase().includes("network error"))
      ) {
        if (didShowNetworkErrorToast.current) {
          return;
        }
        didShowNetworkErrorToast.current = true;
      }

      setError(type, errorMessage, options);
      eventEmitter.emit("apiError", { type, message: errorMessage });

      if (type === "LOGIN_ERROR" && !didShowLoginErrorToast.current) {
        didShowLoginErrorToast.current = true;
        eventEmitter.emit("showToast", {
          type: "error",
          text: errorMessage,
          message: errorMessage,
          title: errorMessage
        });
      }
      // NETWORK_ERROR toast only once
      if (type === "NETWORK_ERROR" && didShowNetworkErrorToast.current) {
        eventEmitter.emit("showToast", {
          type: "failed",
          text: errorMessage,
          message: errorMessage,
          title: errorMessage
        });
      }
    },
    [dictionary, setError, isLoggingOut]
  );

  const deleteItem = useCallback(async (key) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.log("Error deleting secure storage:", err);
    }
  }, []);

  const cleanupAuth = useCallback(async () => {
    console.log('[cleanupAuth] Start');
    const itemsToDelete = ["token", "credentials", "user", "rcml-lang", "languages"];
    try {
      console.log('[cleanupAuth] Deleting secure items:', itemsToDelete);
      await Promise.all(itemsToDelete.map(async (key) => {
        await deleteItem(key);
        console.log(`[cleanupAuth] Deleted secure item: ${key}`);
      }));
      console.log('[cleanupAuth] Removing async storage: ["branch", "branchNames"]');
      await removeData(["branch", "branchNames"]);
      console.log('[cleanupAuth] Removed async storage');
      // DO NOT clear domain during logout - preserve it
      // setDomain(null); // REMOVED - domain preserved during logout
      setBranchid(null);
      setBranchName(null);
      setUser(null);
      console.log('[cleanupAuth] Cleared branchid, branchName, user (preserved domain)');
      clearErrors(true); // Force clear persistent errors during logout
      
      // Double-clear errors to ensure they're gone
      setError(null);
      forceClearError();
      
      console.log('[cleanupAuth] Cleared errors (including persistent)');
    } catch (e) {
      console.log('[cleanupAuth] Error during cleanup:', e);
    }
    console.log('[cleanupAuth] End');
  }, [clearErrors, deleteItem]);

  // Complete cleanup: clear ALL data including domain (for domain changes)
  const cleanupAuthAndDomain = useCallback(async () => {
    console.log('[cleanupAuthAndDomain] Start - clearing everything including domain');
    const itemsToDelete = ["token", "credentials", "user", "rcml-lang", "languages"];
    try {
      console.log('[cleanupAuthAndDomain] Deleting secure items:', itemsToDelete);
      await Promise.all(itemsToDelete.map(async (key) => {
        await deleteItem(key);
        console.log(`[cleanupAuthAndDomain] Deleted secure item: ${key}`);
      }));
      console.log('[cleanupAuthAndDomain] Removing async storage including domain');
      await removeData(["domain", "branch", "branchNames"]);
      console.log('[cleanupAuthAndDomain] Removed async storage');
      setDomain(null);
      setBranchid(null);
      setBranchName(null);
      setUser(null);
      console.log('[cleanupAuthAndDomain] Cleared ALL data including domain');
      clearErrors();
      console.log('[cleanupAuthAndDomain] Cleared errors');
    } catch (e) {
      console.log('[cleanupAuthAndDomain] Error during cleanup:', e);
    }
    console.log('[cleanupAuthAndDomain] End');
  }, [clearErrors, deleteItem]);

  const readDomain = useCallback(async () => {
    try {
      const domainValue = await getData("domain");
      // If domain is missing or invalid, clear it from storage and state
      if (!domainValue || domainValue === "null" || domainValue === "undefined" || (domainValidator(domainValue) && domainValidator(domainValue).length > 0)) {
        await removeData(["domain"]);
        setDomain(null);
        return false;
      }
      setDomain(domainValue);
      return true;
    } catch (error) {
      handleError(error, "READ_DOMAIN_ERROR");
      return false;
    }
  }, [handleError]);

  const readRestData = useCallback(async () => {
    try {
      const branchValue = await getData("branches");
      if (branchValue && branchValue.id) {
        setBranchid(branchValue.id);
        setBranchName(branchValue);
      } else {
        setBranchid(null);
        setBranchName(null);
      }
    } catch (error) {
      handleError(error, "READ_BRANCH_DATA_ERROR");
    }
  }, [handleError]);

  const login = useCallback(
    async (username, password) => {
      // Reset logged out state when attempting new login
      global.isLoggedOut = false;
      window.isLoggedOut = false;
      
      // Always clear error state and reset toast flag before login attempt
      forceClearError();
      didShowLoginErrorToast.current = false;
      didShowNetworkErrorToast.current = false;
      setIsLoading(true);

      console.log('[AuthProvider login] Attempting login with username:', username);
      console.log('[AuthProvider login] Attempting login with password:', password);
      console.log('[AuthProvider login] Attempting login with URL:', apiUrls?.login);
      try {
        if (!apiUrls?.login) throw new Error("Login URL not set");
        const response = await axiosInstance.post(apiUrls.login, { username, password });
        const { token: authorized, user } = response.data;
        if (!authorized || !user) throw new Error(dictionary?.["errors.LOGIN_FAILED"] || "Login failed");
        const userResponse = { token: authorized, id: user.id, username: user.username };
        await Promise.all([
          SecureStore.setItemAsync("credentials", JSON.stringify({ username, password })),
          SecureStore.setItemAsync("token", JSON.stringify(authorized)),
          SecureStore.setItemAsync("user", JSON.stringify(userResponse)),
        ]);
        // Mark as logged in
        clearErrors();
        eventEmitter.emit("showToast", {
          type: "success",
          text: dictionary?.["auth.ALREADY_AUTHORIZED"] || "ავტორიზაცია წარმატებულია",
          message: dictionary?.["auth.ALREADY_AUTHORIZED"] || "ავტორიზაცია წარმატებულია",
          title: dictionary?.["auth.ALREADY_AUTHORIZED"] || "ავტორიზაცია წარმატებულია"
        });
        window.isLoggedOut = false;
        if (isMounted.current) setUser(userResponse);
      } catch (error) {
        console.log('[AuthProvider login] Error occurred:', error);
        
        // Skip error handling if we're in the middle of logout
        if (isLoggingOut) {
          console.log('[AuthProvider login] Skipping error handling during logout');
          return;
        }
        
        let isNetworkError = false;
        if (!error.response && (error.code === 'ERR_NETWORK' || (error.message && error.message.toLowerCase().includes('network')))) {
          isNetworkError = true;
        }
        
        // Check for 401 unauthorized (credentials error)
        const status = error.response?.status || error.response?.data?.error?.status;
        const serverErrorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message || "";
        
        if (status === 401) {
          // If errorMsg contains 'სესია' or 'session' and does NOT contain credential-related terms, treat as session expired
          if (
            typeof serverErrorMsg === 'string' &&
            (serverErrorMsg.toLowerCase().includes('სესია') || serverErrorMsg.toLowerCase().includes('session')) &&
            !/(match|credentials|user|password|auth|პაროლ|მომხმარებ)/i.test(serverErrorMsg)
          ) {
            const msg = dictionary?.["errors.SESSION_EXPIRED"] || "თქვენი სესია ამოიწურა. გთხოვთ, შეხვიდეთ ხელახლა.";
            setUser(null);
            handleError({ message: msg }, "SESSION_EXPIRED", { persistent: true });
            return;
          } else {
            // All other 401s are invalid credentials - use server message if available
            let errorMessage = serverErrorMsg;
            
            // If no server message or it's in English, use localized fallback
            if (!errorMessage || errorMessage.toLowerCase().includes('these credentials do not match')) {
              errorMessage = dictionary?.["errors.LOGIN_FAILED"] || "მომხმარებელი ან პაროლი არასწორია";
            }
            
            console.log('[AuthProvider login] Login failed with message:', errorMessage);
            setUser(null);
            handleError({ message: errorMessage }, "LOGIN_ERROR", { persistent: true });
            
            // Show toast notification for login error
            eventEmitter.emit("showToast", {
              type: "error",
              text: errorMessage,
              message: errorMessage,
              title: dictionary?.["errors.LOGIN_FAILED"] || "ავტორიზაციის შეცდომა"
            });
            return;
          }
        }
        
        // Handle network errors
        if (isNetworkError) {
          const msg = dictionary?.["errors.NETWORK_ERROR"] || "ქსელთან კავშირის პრობლემა";
          handleError({ message: msg }, "NETWORK_ERROR", { persistent: false });
          eventEmitter.emit("showToast", {
            type: "error",
            text: msg,
            message: msg,
            title: dictionary?.["errors.NETWORK_ERROR"] || "ქსელის შეცდომა"
          });
          return;
        }
        
        // Handle other errors
        const fallbackMsg = dictionary?.["errors.GENERAL"] || "დაფიქსირდა შეცდომა. გთხოვთ, სცადოთ ხელახლა.";
        handleError({ message: fallbackMsg }, "GENERAL", { persistent: false });
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrls, dictionary, handleError, clearErrors, forceClearError]
  );

  // Global logout cleanup: clear authentication data but preserve domain
  const globalLogoutCleanup = useCallback(async (navigation) => {
    console.log('[globalLogoutCleanup] Start - preserving domain');
    setIsLoggingOut(true); // Set logout flag to suppress error toasts
    global.isLoggedOut = true;
    setUser(null);
    // DO NOT clear domain - preserve it for next login
    // setDomain(null); // REMOVED
    setBranchid(null);
    setBranchName(null);
    setBranchEnabled(false);
    setDeliveronEnabled(false);
    setIsVisible(false);
    // Remove authentication and branch data but preserve domain
    try {
      await cleanupAuth();
      // Remove authentication and branch data only - keep domain
      await removeData(["branches", "branch", "branchNames", "selectedMusicId", "repeatSound", "soundVolume"]);
      await SecureStore.deleteItemAsync("refreshToken").catch(() => {});
      await SecureStore.deleteItemAsync("accessToken").catch(() => {});
      console.log('[globalLogoutCleanup] Cleared auth data, preserved domain');
    } catch (e) {
      console.log('[globalLogoutCleanup] Error:', e);
    }
    // Emit event to stop all intervals/polling
    eventEmitter.emit('forceLogout');
    
    // Aggressive error clearing during logout
    try {
      setError(null);
      forceClearError();
      clearErrors(true);
    } catch (e) {
      console.log('[globalLogoutCleanup] Error clearing failed:', e);
    }
    
    setIsLoggingOut(false); // Clear logout flag
    setJustLoggedOut(true); // Set flag to indicate recent logout
    console.log('[globalLogoutCleanup] End');
  }, [cleanupAuth]);

  const logout = useCallback(async (navigation) => {
    console.log('[logout] Start');
    setIsLoading(true);
    await globalLogoutCleanup(navigation);
    
    // Don't use navigation.reset here - let RootNavigator handle routing via justLoggedOut flag
    console.log('[logout] Logout complete, navigation will be handled by RootNavigator');
    
    setIsLoading(false);
    console.log('[logout] End');
  }, [globalLogoutCleanup]);

  const fetchBranchStatus = useCallback(async () => {
    if (!domain || !branchid || !apiUrls?.branchStatus) return;

    try {
      const res = await axiosInstance.post(apiUrls.branchStatus, { branchid });
      if (typeof res?.data?.data === "boolean") {
        const isClosed = res.data.data === false;
        setBranchEnabled(!isClosed);
        setIsVisible(isClosed);

        if (isClosed) {
          handleError(
            { message: dictionary?.["orders.branchDisabled"] || "Branch is temporarily closed" },
            "BRANCH_TEMPORARILY_CLOSED",
            { persistent: true } // persistent რომ დარჩეს
          );
        }
      } else {
        handleError(
          new Error("Branch status response not in expected format"),
          "FETCH_BRANCH_STATUS_INVALID"
        );
      }
    } catch (error) {
      handleError(error, "FETCH_BRANCH_STATUS_ERROR");
    }
  }, [domain, branchid, apiUrls, handleError, dictionary]);

  const fetchDeliveronStatus = useCallback(async () => {
    if (!domain || !apiUrls?.deliveronStatus) return;
    try {
      const res = await axiosInstance.post(apiUrls.deliveronStatus);
      const deliveronData = res?.data?.data;
      setDeliveronEnabled(deliveronData?.status === 0);
    } catch (error) {
      handleError(error, "FETCH_DELIVERON_STATUS_ERROR");
    }
  }, [domain, apiUrls, handleError]);

  const fetchAllStatus = useCallback(async () => {
    await Promise.all([fetchBranchStatus(), fetchDeliveronStatus()]);
  }, [fetchBranchStatus, fetchDeliveronStatus]);


  const loadUser = useCallback(async () => {
    if (global.isLoggedOut) {
      console.log('[loadUser] Skipped: global.isLoggedOut is true');
      return;
    }
    try {
      const [credentials, token] = await Promise.all([getSecureData("credentials"), getSecureData("token")]);
      if (credentials && token) {
        const { username, password } = credentials;
        await login(username, password);
      }
    } catch (error) {
      handleError(error, "LOAD_USER_ERROR");
    }
  }, [login, handleError]);


  useEffect(() => {
    if (user) {
      // Always reset toast flags on successful login
      didShowLoginErrorToast.current = false;
      didShowNetworkErrorToast.current = false;
      if (!didShowAuthToast.current) {
        didShowAuthToast.current = true;
        const msg = dictionary?.["auth.ALREADY_AUTHORIZED"] || "ავტორიზებული იუზერი";
        eventEmitter.emit("showToast", {
          type: "success",
          text: msg,
          message: msg,
          title: msg
        });
      }
    }
  }, [user, dictionary]);


  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!apiUrls?.deliveronStatus || !apiUrls?.branchStatus) return;

    fetchAllStatus();

    const handleAppStateChange = (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === "active") {
        fetchAllStatus();
        if (global.isLoggedOut) return;
        if (!user && isConnected && apiUrls?.authUser) loadUser();
      }
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [appState, apiUrls, isConnected, user, fetchAllStatus, loadUser]);


  useEffect(() => {
    if (!isConnected) return;
    (async () => {
      const hasDomain = await readDomain();
      if (hasDomain) await readRestData();
    })();
  }, [isConnected, readDomain, readRestData]);


  useEffect(() => {
    if (global.isLoggedOut) return;
    if (!user && apiUrls?.authUser && isConnected) loadUser();
  }, [user, apiUrls?.authUser, isConnected, loadUser]);


  useEffect(() => {
    if (languages.length === 0 || !apiUrls) return;

    (async () => {
      try {
        const savedLang = await getData("rcml-lang");
        if (!savedLang) {
          // Prioritize English as the default language
          const englishLang = languages.find((l) => l.lang === 'en');
          const defaultLang = englishLang || languages.find((l) => l.default === 1);
          
          if (defaultLang) {
            await storeData("rcml-lang", defaultLang.lang);
            userLanguageChange(defaultLang.lang);
          }
        }
        await storeData("languages", languages);
        setAvailableLanguages(languages);
      } catch (error) {
        handleError(error, "LANGUAGE_INIT_ERROR");
      }
    })();
  }, [languages, apiUrls, userLanguageChange, setAvailableLanguages, handleError]);


useEffect(() => {
  const listener = eventEmitter.addEventListener("sessionExpired", (event) => {

    if (event && event.type === "CREDENTIALS_ERROR") {
      handleError({ message: dictionary?.["errors.LOGIN_FAILED"] || "მომხმარებელი ან პაროლი არასწორია" }, "LOGIN_ERROR", { persistent: false });
      setUser(null);
    } else {
      // Default: treat as session expired
      window.isLoggedOut = true;
      cleanupAuth();
      handleError({ message: dictionary?.["errors.SESSION_EXPIRED"] }, "SESSION_EXPIRED", { persistent: true });
    }
  });
  return () => eventEmitter.removeEventListener(listener);
}, [cleanupAuth, handleError, dictionary]);

  const contextValue = useMemo(() => ({
    domain,
    setDomain,
    user,
    error,
    setError,
    clearErrors,
    isLoading,
    setIsLoading,
    branchid,
    setBranchid,
    branchName,
    branchEnabled,
    setBranchEnabled,
    deliveronEnabled,
    setDeliveronEnabled,
    setIsVisible,
    login,
    logout,
    deleteItem,
    readDomain,
    readRestData,
    handleError,
    cleanupAuthAndDomain, // For explicit domain changes
    languages,
    justLoggedOut,
    clearJustLoggedOut,
  }), [
    domain,
    user,
    error,
    isLoading,
    branchid,
    branchName,
    branchEnabled,
    deliveronEnabled,
    isVisible,
    login,
    logout,
    deleteItem,
    readDomain,
    readRestData,
    handleError,
    cleanupAuthAndDomain,
    languages,
    clearErrors,
    justLoggedOut,
    clearJustLoggedOut,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      <AppUpdates
        showLogs={true}
        playStoreUrl="https://play.google.com/store/apps/details?id=com.kovzy.app"
        onError={(err) => handleError(err, "UPDATE_ERROR")}
      />

      {isLoading ? (
        <Loader text={dictionary?.["loading"]} />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
