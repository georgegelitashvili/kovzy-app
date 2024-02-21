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
  const [options, setOptions] = useState({});
  const [loginError, setLoginError] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const [branchEnabled, setBranchEnabled] = useState(false);
  const [deliveronEnabled, setDeliveronEnabled] = useState(false);

  const { dictionary } = useContext(LanguageContext);

  // console.log('------------------------ auth');
  // console.log(domain);
  // console.log(branchName);
  // console.log(branchid);
  // console.log('------------------------ end auth');

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
    const interval = setInterval(async () => {
      if (domain) {
        await axiosInstance.post(options.url_deliveronStatus).then((resp) => {
          setDeliveronEnabled(resp.data.data.status == 0 ? true : false);
        });

        if (branchid) {
          await axiosInstance
            .post(options.url_branchStatus, { branchid: branchid })
            .then((resp) => {
              setBranchEnabled(resp.data.data);
              setIsVisible(resp.data.data);
            });
        }
      }
    }, 5000);

    return () => {
      clearInterval(interval);
    };

  }, [domain, branchid]);

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
          await axiosInstance
            .post(options.url_login, {
              password,
              username,
            })
            .then((e) => {
              if (e.data.error) {
                setLoginError(e.data.error.message);
                return;
              }
              SecureStore.setItemAsync('credentials', JSON.stringify({ username: username, password: password }));

              SecureStore.setItemAsync('cookie', JSON.stringify(e.headers['set-cookie']));
              setUser(JSON.stringify(e.headers['set-cookie']));
              setIsLoading(false);
            });
        },
        logout: async () => {
          setIsLoading(true);
          await axiosInstance.get(options.url_logout)
            .then((resp) => resp.data)
            .then((data) => {
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
          })
        },
      }}
    >
      {children}

      {isVisible == false && (
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
