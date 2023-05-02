import React, { createContext, useState, useEffect } from "react";
import { DevSettings } from "react-native";
import axiosInstance from "../apiConfig/apiRequests";
import * as SecureStore from 'expo-secure-store';
import { removeData, getMultipleData } from "../helpers/storage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [domain, setDomain] = useState(null);
  const [branchid, setBranchid] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataSet, setIsDataSet] = useState(false);
  const [options, setOptions] = useState({});
  const [loginError, setLoginError] = useState([]);

  useEffect(() => {
    readData();
  }, [isDataSet]);

  useEffect(() => {
    if (domain) {
      apiOptions();
    }
  }, [domain]);


  const readData = async () => {
    await getMultipleData(["domain", "branch"]).then((data) => {
      let domain = JSON.parse(data[0][1]);
      let branchid = JSON.parse(data[1][1]);

      setDomain(domain);
      setBranchid(branchid);
    });
  };

  const apiOptions = () => {
    setOptions({
      url_login: `https://${domain}/api/auth/login`,
      url_logout: `https://${domain}/api/auth/logout`,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loginError,
        isLoading,
        domain,
        branchid,
        setIsDataSet,
        login: (username, password) => {
          setIsLoading(true);
          axiosInstance
            .post(options.url_login, {
              password,
              username,
            })
            .then((e) => {
              if (e.error) {
                setLoginError(e.error.message);
                return null;
              }

              SecureStore.setItemAsync('cookie', JSON.stringify(e.headers['set-cookie']));
              SecureStore.setItemAsync('user', JSON.stringify(e.data.data));
              setUser(e.data.data);

              setIsLoading(false);
            });
        },
        logout: () => {
          axiosInstance.get(options.url_logout).then((resp) => {
            setIsDataSet(false);
            setUser(null);
            removeData();
            SecureStore.deleteItemAsync('cookie');
            SecureStore.deleteItemAsync('user');
            DevSettings.reload();
          })
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
