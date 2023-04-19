import React, { createContext, useState } from 'react'
import { storeData, getData, getMultipleData } from "../helpers/storage";
import { useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [domain, setDomain] = useState(null);
    const [branchid, setBranchid] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDataSet, setIsDateSet] = useState(false);
    const [orders, setOrders] = useState([]);

    const readData = async () => {
        await getMultipleData(["domain", "branch"]).then((data) => {
            console.log('----------- authProvider');
            console.log(data);
            console.log('----------- end authProvider');

            let domain = JSON.parse(data[0][1]);
            let branchid = JSON.parse(data[1][1]);

            setDomain(domain);
            setBranchid(branchid);
            setIsDateSet(true);
          });
      }

      useEffect(() => {
        if(isDataSet) {
            readData();
        }
      }, [isDataSet])

    return(
        <AuthContext.Provider
            value={{
                user,
                setUser,
                isLoading,
                domain,
                branchid,
                orders,
                setOrders,
                setIsDateSet,
                login: (username, password) => {
                    setUser('giorgi');
                },
                logout: () => {
                    setUser(null);
                }
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}