import React, { createContext, useContext, useState, useEffect } from "react";
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
  }); // api options
  const [loginError, setLoginError] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const [branchEnabled, setBranchEnabled] = useState(false);
  const [deliveronEnabled, setDeliveronEnabled] = useState(false);

  const { dictionary } = useContext(LanguageContext);

  const handleClick = () => {
    setIsVisible(true);
  };

  const readData = async () => {
    await getMultipleData(["domain", "branch", "branchName"]).then((data) => {
      let domain = JSON.parse(data[0][1]);
      let branchid = JSON.parse(data[1][1]);
      let branchName = JSON.parse(data[2][1]);

      setDomain(domain);
      setBranchid(branchid);
      setBranchName(branchName);
      if (domain != null && branchid != null && branchName != null) {
        setIsDataSet(true);
      } else {
        setIsDataSet(false);
      }
    });
  };

  const apiOptions = () => {
    setOptions({
      url_login: `https://${domain}/api/v1/admin/auth/login`,
      url_logout: `https://${domain}/api/v1/admin/auth/logout`,
      url_branchStatus: `https://${domain}/api/v1/admin/branchStatus`,
      url_deliveronStatus: `https://${domain}/api/v1/admin/deliveronStatus`,
    });
  };

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
    if (domain) {
      apiOptions();
    }
  }, [domain]);

  useEffect(() => {
    const fetchData = async () => {
      if (domain) {
        try {
          const deliveronResponse = await axiosInstance.post(options.url_deliveronStatus);
          setDeliveronEnabled(deliveronResponse.data.data.status === 0);

          if (branchid) {
            const branchResponse = await axiosInstance.post(options.url_branchStatus, { branchid });
            setBranchEnabled(branchResponse.data.data);
            setIsVisible(branchResponse.data.data);
          }
        } catch (error) {
          console.log('Error fetching data:', error);
        }
      }
    };

    const interval = setInterval(fetchData, 5000);

    return () => {
      clearInterval(interval);
    };

  }, [domain, branchid, options]);

  return (
    <AuthContext.Provider
      value={{
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
        login: async (username, password) => {
          setIsLoading(true);
          try {
            const response = await axiosInstance.post(options.url_login, { password, username });
            if (response.data.error) {
              setLoginError(response.data.error.message);
              return;
            }
            SecureStore.setItemAsync('credentials', JSON.stringify({ username, password }));
            SecureStore.setItemAsync('cookie', JSON.stringify(response.headers['set-cookie']));
            setUser(JSON.stringify(response.headers['set-cookie']));
            setIsLoading(false);
          } catch (error) {
            console.log('Error logging in:', error);
            setLoginError('An error occurred while logging in. Please try again.');
            setIsLoading(false);
          }
        },
        logout: async () => {
          setIsLoading(true);
          try {
            await axiosInstance.get(options.url_logout);
            deleteItem("cookie");
            deleteItem("credentials");
            removeData("domain");
            removeData("branch");
            removeData("branchName");
            setDomain(null);
            setBranchid(null);
            setBranchName(null);
            setIsDataSet(false);
            setUser(null);
            setIsLoading(false);
          } catch (error) {
            console.log('Error logging out:', error);
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
