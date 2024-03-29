import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import axiosInstance from "../apiConfig/apiRequests";
import * as SecureStore from 'expo-secure-store';
import { removeData, getMultipleData } from "../helpers/storage";
import Toast from '../components/generate/Toast';
import { String, LanguageContext } from "../components/Language";

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
    url_deliveronStatus: ""
  });
  const [loginError, setLoginError] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const [branchEnabled, setBranchEnabled] = useState(false);
  const [deliveronEnabled, setDeliveronEnabled] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [shouldRenderAuthScreen, setShouldRenderAuthScreen] = useState(false);

  const { dictionary } = useContext(LanguageContext);

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
      setOptions({
        url_login: `https://${domain}/api/v1/admin/auth/login`,
        url_logout: `https://${domain}/api/v1/admin/auth/logout`,
        url_branchStatus: `https://${domain}/api/v1/admin/branchStatus`,
        url_deliveronStatus: `https://${domain}/api/v1/admin/deliveronStatus`,
      });
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

  useEffect(() => {
    readData();
  }, [isDataSet]);

  useEffect(() => {
    apiOptions();
  }, [domain, isDataSet]);

  useEffect(() => {
    const fetchData = async () => {
      if (!domain || !user) return;

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

    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [domain, branchid, user, options]);

  return (
    <AuthContext.Provider
      value={{
        domain,
        setDomain,
        user,
        setUser,
        loginError,
        isLoading,
        domain,
        setDomain,
        branchid,
        setIsDataSet,
        isDataSet,
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
        login: async (username, password) => {
          setIsLoading(true);
          try {
            const response = await axiosInstance.post(options.url_login, { password, username });
            const jsonObject = response.data;
            // Accessing the value of authorized
            const error = jsonObject.data.error;
            // Accessing the value of authorized
            const authorized = jsonObject.data.authorized;

            if (error) {
              setLoginError(jsonObject.data.error.message);
              return;
            }

            if (authorized === true) {
              SecureStore.setItemAsync('credentials', JSON.stringify({ username, password }));
              SecureStore.setItemAsync('cookie', JSON.stringify(response.headers['set-cookie']));
              setUser(response.headers['set-cookie']);
              setShouldRenderAuthScreen(false);
            }
          } catch (error) {
            console.log('Error logging in:', error);
            setLoginError('An error occurred while logging in. Please try again.');
            clearInterval(intervalId);
          } finally {
            setIsLoading(false);
          }
        },
        logout: async () => {
          setIsLoading(true);
          try {
            const headers = { Cookie: JSON.parse(await SecureStore.getItemAsync('cookie')) };
            await axiosInstance.get(options.url_logout, { headers });
            deleteItem("cookie");
            deleteItem("credentials");
            removeData(["domain", "branch", "branchName"]);
            setDomain(null);
            setBranchid(null);
            setBranchName(null);
            setIsDataSet(false);
            setUser(null);
            clearInterval(intervalId);
            setIntervalId(null);
            setShouldRenderAuthScreen(false);
          } catch (error) {
            console.log('Error logging out:', error);
            clearInterval(intervalId);
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
