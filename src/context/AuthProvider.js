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
import axiosInstance from "../apiConfig/apiRequests";
import * as SecureStore from "expo-secure-store";
import {
  storeData,
  getData,
  getSecureData,
  removeData,
} from "../helpers/storage";
import Toast from "../components/generate/Toast";
import { useFetchLanguages } from "../components/UseFetchLanguages";
import { LanguageContext } from "../components/Language";
import Loader from "../components/generate/loader";
import ErrorDisplay from "../components/generate/ErrorDisplay";
import useErrorDisplay from '../hooks/useErrorDisplay';
import AppUpdates from "../components/AppUpdates";
import eventEmitter from "../utils/EventEmitter";

export const AuthContext = createContext();

export const AuthProvider = ({ isConnected, children }) => {
  // ==== ყველა Hook აუცილებლად ერთ რიგში და კონდიციონალი ლოგიკის გარეშე ====  
  const [user, setUser] = useState(null);
  const [domain, setDomain] = useState(null);
  const [branchid, setBranchid] = useState(null);
  const [branchName, setBranchName] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [branchEnabled, setBranchEnabled] = useState(false);
  const [deliveronEnabled, setDeliveronEnabled] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [isVisible, setIsVisible] = useState(false);

  const isMounted = useRef(true);

  // ყველა Context Hook ერთდროულად
  const { setAvailableLanguages, userLanguageChange, dictionary } = useContext(LanguageContext);

  // apiUrls useMemo ადრე, რომ useFetchLanguages-სთვის მზად იყოს
  const apiUrls = useMemo(() => {
    if (!domain) return null;
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
      return null;
    }
  }, [domain]);

  // Custom Hook-ები სტაბილური რიგით
  const { languages } = useFetchLanguages(apiUrls);
  const {
    errorDisplay,
    error,
    setError,
    clearError,
    persistent
  } = useErrorDisplay();

  const clearErrors = useCallback(() => {
    console.log('[AuthProvider] clearErrors called');
    setLoginError(null);
    clearError();
  }, [clearError]);

  // useEffect რომელიც ავტომატურად ასუფთავებს ერორებს - ამოვიღე რადგან persistent ერორებს ხელს უშლის

  const handleError = useCallback(
    (errorParam, type = "UNKNOWN", options = {}) => {
      // ზოგადი ერორების დამუშავება
      const errorMessage = errorParam?.message || dictionary?.["errors.UNKNOWN"] || "Unknown error";
      console.log(`[AuthProvider handleError] Calling setError with:`, { type, errorMessage, options });
      setError(type, errorMessage, options);
      eventEmitter.emit("apiError", { type, message: errorMessage });
    },
    [dictionary, setError]
  );

  const deleteItem = useCallback(async (key) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.log("Error deleting secure storage:", err);
    }
  }, []);

  const cleanupAuth = useCallback(async () => {
    const itemsToDelete = ["token", "credentials", "user", "rcml-lang", "languages"];
    await Promise.all(itemsToDelete.map(deleteItem));
    await removeData(["domain", "branch", "branchNames"]);
    setDomain(null);
    setBranchid(null);
    setBranchName(null);
    setUser(null);
    clearErrors();
  }, [clearErrors, deleteItem]);

  const readDomain = useCallback(async () => {
    try {
      const domainValue = await getData("domain");
      if (!domainValue || domainValue === "null" || domainValue === "undefined") return false;
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
      clearErrors();
      setIsLoading(true);
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
        if (isMounted.current) setUser(userResponse);
      } catch (error) {
        // Detect network error and handle as NETWORK_ERROR, not LOGIN_ERROR
        let isNetworkError = false;
        if (!error.response && (error.code === 'ERR_NETWORK' || (error.message && error.message.toLowerCase().includes('network')))) {
          isNetworkError = true;
        }
        const errorMessage = error.response?.data?.message || error.message;
        setLoginError(errorMessage);
        if (isNetworkError) {
          handleError(error, "NETWORK_ERROR", { persistent: true });
        } else {
          handleError(error, "LOGIN_ERROR", { persistent: true }); // persistent=true რომ დარჩეს სანამ დახურავ
        }
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrls, dictionary, handleError, clearErrors]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      if (apiUrls?.logout) await axiosInstance.post(apiUrls.logout);
      await cleanupAuth();
    } catch (error) {
      handleError(error, "LOGOUT_ERROR");
      await cleanupAuth();
    } finally {
      setIsLoading(false);
    }
  }, [apiUrls, cleanupAuth, handleError]);

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
    if (!user && apiUrls?.authUser && isConnected) loadUser();
  }, [user, apiUrls?.authUser, isConnected, loadUser]);

  useEffect(() => {
    if (languages.length === 0 || !apiUrls) return;

    (async () => {
      try {
        const defaultLang = languages.find((l) => l.default === 1);
        const savedLang = await getData("rcml-lang");
        if (!savedLang && defaultLang) {
          await storeData("rcml-lang", defaultLang.lang);
          userLanguageChange(defaultLang.lang);
        }
        await storeData("languages", languages);
        setAvailableLanguages(languages);
      } catch (error) {
        handleError(error, "LANGUAGE_INIT_ERROR");
      }
    })();
  }, [languages, apiUrls, userLanguageChange, setAvailableLanguages, handleError]);

  useEffect(() => {
    const listener = eventEmitter.addEventListener("sessionExpired", () => {
      cleanupAuth();
      handleError({ message: dictionary?.["errors.SESSION_EXPIRED"] }, "SESSION_EXPIRED", { persistent: true });
    });
    return () => eventEmitter.removeEventListener(listener);
  }, [cleanupAuth, handleError, dictionary]);

  const contextValue = useMemo(() => ({
    domain,
    setDomain,
    user,
    loginError,
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
    languages,
  }), [
    domain,
    user,
    loginError,
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
    languages,
    clearErrors,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      <AppUpdates
        showLogs={true}
        playStoreUrl="https://play.google.com/store/apps/details?id=com.kovzy.app"
        onError={(err) => handleError(err, "UPDATE_ERROR")}
      />

      {/* ErrorDisplay კომპონენტი, რომელიც აჩვენებს current error-ს */}
      {errorDisplay}

      {/* Loading სპინერი თუ საჭირო */}
      {isLoading ? (
        <Loader text={dictionary?.["loading"]} />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
