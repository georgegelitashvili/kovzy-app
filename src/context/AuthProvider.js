import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { AppState, View, StyleSheet } from "react-native";
import axiosInstance from "../apiConfig/apiRequests";
import * as SecureStore from "expo-secure-store";
import {
  storeData,
  getData,
  getSecureData,
  removeData,
} from "../helpers/storage";
import { useFetchLanguages } from "../components/UseFetchLanguages";
import { LanguageContext } from "../components/Language";
import useErrorDisplay from '../hooks/useErrorDisplay';
import AppUpdates from "../components/AppUpdates";
import eventEmitter from "../utils/EventEmitter";
import Loader from "../components/generate/loader";

export const AuthContext = createContext();
export const AuthStateContext = createContext(null);
export const AuthActionsContext = createContext(null);

export const useAuthState = () => {
  const context = useContext(AuthStateContext);
  if (!context) {
    throw new Error('useAuthState must be used within AuthProvider');
  }
  return context;
};

export const useAuthActions = () => {
  const context = useContext(AuthActionsContext);
  if (!context) {
    throw new Error('useAuthActions must be used within AuthProvider');
  }
  return context;
};

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
  const autoLoginAttempted = useRef(false);
  const languageDomainRef = useRef(null);

  // ყველა Context Hook ერთდროულად
  const { setAvailableLanguages, userLanguageChange, dictionary } = useContext(LanguageContext);

  // Helper to build API URL for a specific domain (used for domain validation before setting domain state)
  const buildApiUrl = useCallback((domainValue, endpoint) => {
    try {
      const url = new URL(`https://${domainValue}`);
      return `${url.origin}/api/v1/admin/${endpoint}`;
    } catch {
      return null;
    }
  }, []);

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
        checkDomain: `${url.origin}/api/v1/admin/checkDomain`,
      };
    } catch {
      return null;
    }
  }, [domain]);

  // Custom Hook-ები სტაბილური რიგით
  const { languages } = useFetchLanguages(apiUrls);
  const {
    error,
    setError,
    clearError,
    persistent,
    errorDisplay,
  } = useErrorDisplay({ showInline: true });

  const clearErrors = useCallback(() => {
    console.log('[AuthProvider] clearErrors called');
    setLoginError(null);
    clearError();
  }, [clearError]);

  // useEffect რომელიც ავტომატურად ასუფთავებს ერორებს - ამოვიღე რადგან persistent ერორებს ხელს უშლის

  const handleError = useCallback(
    (errorParam, type = "UNKNOWN", options = {}) => {
      const rawMessage = errorParam?.message;
      const errorMessage =
        typeof rawMessage === "string"
          ? rawMessage
          : rawMessage && typeof rawMessage === "object"
            ? Object.values(rawMessage).flat().filter((item) => typeof item === "string").join("\n")
            : dictionary?.["errors.UNKNOWN"] || "Unknown error";
      console.log(`[AuthProvider handleError] Calling setError with:`, { type, errorMessage, options });
      setError(type, errorMessage || dictionary?.["errors.UNKNOWN"] || "Unknown error", options);
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
    await removeData(["domain", "branch", "branchNames", "branches"]);
    autoLoginAttempted.current = false;
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

  // Validate domain exists in the backend system before saving
  const checkDomain = useCallback(async (domainValue) => {
    try {
      const checkDomainUrl = buildApiUrl(domainValue, 'checkDomain');
      if (!checkDomainUrl) {
        return { success: false, error: { type: 'INVALID_DOMAIN', message: 'Invalid domain format' } };
      }

      const response = await axiosInstance.post(checkDomainUrl, { domain: domainValue });
      
      // Success response: { message: "Ok" }
      if (response?.data?.message === 'Ok') {
        return { success: true };
      }
      
      return { success: false, error: { type: 'DOMAIN_CHECK_ERROR', message: 'Unexpected response' } };
    } catch (error) {
      // Handle API error response: { error: { message, code, status } }
      const apiError = error.response?.data?.error;
      if (apiError) {
        return {
          success: false,
          error: {
            type: apiError.code || 'DOMAIN_CHECK_ERROR',
            message: apiError.message || dictionary?.['errors.WEBSITE_NOT_FOUND'] || 'Website not found',
            status: apiError.status
          }
        };
      }
      
      // Network/client errors: return type only so the UI localizes via LanguageContext.
      return {
        success: false,
        error: {
          type: error.type || 'DOMAIN_CHECK_ERROR',
        }
      };
    }
  }, [buildApiUrl, dictionary]);

  const resolveBranchById = useCallback(async (branchId, domainValue) => {
    const branchesUrl = buildApiUrl(domainValue, "branches");
    if (!branchesUrl || branchId == null) return null;

    try {
      const response = await axiosInstance.post(branchesUrl);
      const branches = response.data?.branches || [];
      return (
        branches.find(
          (branch) =>
            branch.id === branchId ||
            branch.id === Number(branchId) ||
            String(branch.id) === String(branchId)
        ) || null
      );
    } catch (error) {
      if (__DEV__) {
        console.log("[AuthProvider] Failed to resolve branch name:", error?.message);
      }
      return null;
    }
  }, [buildApiUrl]);

  const readRestData = useCallback(async () => {
    try {
      const branchValue = await getData("branches");
      if (branchValue?.id) {
        setBranchid(branchValue.id);
        setBranchName(branchValue);
        return;
      }

      const savedBranchId = await getData("branch");
      if (savedBranchId) {
        setBranchid(savedBranchId);

        const domainValue = domain || (await getData("domain"));
        if (domainValue) {
          const resolvedBranch = await resolveBranchById(savedBranchId, domainValue);
          if (resolvedBranch) {
            setBranchName(resolvedBranch);
            await storeData("branches", resolvedBranch);
          }
        }
        return;
      }

      setBranchid(null);
      setBranchName(null);
    } catch (error) {
      handleError(error, "READ_BRANCH_DATA_ERROR");
    }
  }, [domain, handleError, resolveBranchById]);

  useEffect(() => {
    if (!domain || !branchid || branchName) return;

    let cancelled = false;

    (async () => {
      const storedBranch = await getData("branches");
      if (storedBranch?.id && !cancelled) {
        setBranchName(storedBranch);
        return;
      }

      const resolvedBranch = await resolveBranchById(branchid, domain);
      if (resolvedBranch && !cancelled) {
        setBranchName(resolvedBranch);
        await storeData("branches", resolvedBranch);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [domain, branchid, branchName, resolveBranchById]);

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
        // Always show localized login messages; never surface raw English API text.
        const statusCode =
          error?.statusCode ||
          error?.originalError?.response?.status ||
          error?.response?.status;
        const payload = error?.data || error?.originalError?.response?.data || error?.response?.data;
        const validationErrors =
          payload?.error?.errors ||
          (payload?.error?.message && typeof payload.error.message === 'object'
            ? payload.error.message
            : null);

        const localizedLoginError =
          dictionary?.["errors.INVALID_CREDENTIALS"] ||
          dictionary?.["errors.LOGIN_ERROR"] ||
          "Login failed";

        // Only clear username when API says username itself is invalid (422 + username field).
        // Wrong password (401) must keep the username.
        const usernameInvalid =
          statusCode === 422 && Boolean(validationErrors?.username);

        setLoginError({
          clearUsername: usernameInvalid,
          highlightUsername: usernameInvalid,
          highlightPassword: true,
        });

        handleError({ message: localizedLoginError }, "LOGIN_ERROR", { persistent: true });
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
      // New API format: { data: boolean } where true = active (open), false = closed
      if (typeof res?.data?.data === "boolean") {
        const isActive = res.data.data; // true = active/open, false = closed
        setBranchEnabled(isActive);
        setIsVisible(!isActive); // Show warning when NOT active (closed)

        if (!isActive) {
          handleError(
            { message: dictionary?.["orders.branchDisabled"] || "Branch is temporarily closed" },
            "BRANCH_TEMPORARILY_CLOSED",
            { persistent: true }
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
    setIsLoading(true);
    try {
      const [credentials, token] = await Promise.all([getSecureData("credentials"), getSecureData("token")]);
      if (credentials && token) {
        const { username, password } = credentials;
        await login(username, password);
      }
    } catch (error) {
      handleError(error, "LOAD_USER_ERROR");
    } finally {
      setIsLoading(false);
    }
  }, [login, handleError]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const appStateRef = useRef(appState);
  appStateRef.current = appState;

  useEffect(() => {
    if (!apiUrls?.deliveronStatus || !apiUrls?.branchStatus) return;

    fetchAllStatus();

    const handleAppStateChange = (nextAppState) => {
      const wasBackground = appStateRef.current.match(/inactive|background/);
      if (wasBackground && nextAppState === "active") {
        fetchAllStatus();
        if (!user && isConnected && apiUrls?.authUser) loadUser();
      }
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
    // Intentionally omit appState — including it re-fetched status on every state change and could snap switches back
  }, [apiUrls, isConnected, user, fetchAllStatus, loadUser]);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const hasDomain = await readDomain();
        if (hasDomain) await readRestData();
      } catch (error) {
        if (!cancelled) {
          handleError(error, "BOOTSTRAP_ERROR");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isConnected, readDomain, readRestData, handleError]);

  useEffect(() => {
    if (autoLoginAttempted.current || user || !apiUrls?.authUser || !isConnected) {
      return;
    }
    autoLoginAttempted.current = true;
    loadUser();
  }, [user, apiUrls?.authUser, isConnected, loadUser]);

  useEffect(() => {
    if (languages.length === 0 || !apiUrls || !domain) return;

    (async () => {
      try {
        const defaultLang = languages.find((l) => l.default === 1);
        const savedLang = await getData("rcml-lang");
        const domainChanged = languageDomainRef.current !== domain;

        if (defaultLang) {
          // On domain change, always switch to that domain's default language.
          // On same domain, only set default when nothing was saved yet.
          if (domainChanged || !savedLang) {
            if (savedLang !== defaultLang.lang) {
              await storeData("rcml-lang", defaultLang.lang);
              await userLanguageChange(defaultLang.lang);
            } else if (!savedLang) {
              await storeData("rcml-lang", defaultLang.lang);
            }
          }
        }

        languageDomainRef.current = domain;
        await storeData("languages", languages);
        setAvailableLanguages(languages);
      } catch (error) {
        handleError(error, "LANGUAGE_INIT_ERROR");
      }
    })();
  }, [languages, apiUrls, domain, userLanguageChange, setAvailableLanguages, handleError]);

  useEffect(() => {
    const listener = eventEmitter.addEventListener("sessionExpired", () => {
      cleanupAuth();
      handleError({ message: dictionary?.["errors.SESSION_EXPIRED"] }, "SESSION_EXPIRED", { persistent: true });
    });
    return () => eventEmitter.removeEventListener(listener);
  }, [cleanupAuth, handleError, dictionary]);

  const authState = useMemo(() => ({
    domain,
    user,
    loginError,
    error,
    isLoading,
    branchid,
    branchName,
    branchEnabled,
    deliveronEnabled,
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
    languages,
  ]);

  const authActions = useMemo(() => ({
    setDomain,
    setError,
    clearErrors,
    setIsLoading,
    setBranchid,
    setBranchEnabled,
    setDeliveronEnabled,
    setIsVisible,
    login,
    logout,
    deleteItem,
    readDomain,
    readRestData,
    handleError,
    checkDomain,
  }), [
    login,
    logout,
    deleteItem,
    readDomain,
    readRestData,
    handleError,
    clearErrors,
    checkDomain,
  ]);

  const contextValue = useMemo(
    () => ({ ...authState, ...authActions }),
    [authState, authActions]
  );

  return (
    <AuthStateContext.Provider value={authState}>
      <AuthActionsContext.Provider value={authActions}>
        <AuthContext.Provider value={contextValue}>
          <AppUpdates
            showLogs={true}
            playStoreUrl="https://play.google.com/store/apps/details?id=com.kovzy.app"
            onError={(err) => handleError(err, "UPDATE_ERROR")}
          />

          <View style={styles.appRoot}>
            {children}
            {isLoading ? (
              <View style={styles.loadingOverlay} pointerEvents="auto">
                <Loader text={dictionary?.["loading"]} />
              </View>
            ) : null}
            {errorDisplay && error?.type !== "LOGIN_ERROR" ? (
              <View style={styles.errorOverlay} pointerEvents="box-none">
                {errorDisplay}
              </View>
            ) : null}
          </View>
        </AuthContext.Provider>
      </AuthActionsContext.Provider>
    </AuthStateContext.Provider>
  );
};

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10001,
    elevation: 10001,
    backgroundColor: "rgba(255,255,255,0.72)",
    justifyContent: "center",
    alignItems: "center",
  },
  errorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10000,
    elevation: 10000,
  },
});
