import React, { createContext, useState, useEffect } from 'react'
import { storeData, getData, getMultipleData } from "../helpers/storage";
import { DevSettings } from 'react-native';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [domain, setDomain] = useState(null);
    const [branchid, setBranchid] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDataSet, setIsDataSet] = useState(false);

    const readData = async () => {
        await getMultipleData(["domain", "branch"]).then((data) => {
            let domain = JSON.parse(data[0][1]);
            let branchid = JSON.parse(data[1][1]);

            setDomain(domain);
            setBranchid(branchid);
          });
      }

      useEffect(() => {
        readData();
      })

    return(
        <AuthContext.Provider
            value={{
                user,
                setUser,
                isLoading,
                domain,
                branchid,
                setIsDataSet,
                login: (username, password) => {
                    setUser('giorgi');
                },
                logout: () => {
                    setUser(null);
                    DevSettings.reload();
                }
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}