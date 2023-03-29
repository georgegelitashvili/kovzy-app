import React, { useState, useContext, useEffect, useCallback } from "react";

import { authLegal } from "../redux/Actions";
import { useDispatch, useSelector } from "react-redux";
import { storeData, getData } from '../helpers/storage';


export const authorizedLegal = () =>
{
    const { isLoggingIn } = useSelector((state) => state.authReducer);
    const { isAuthenticated } = useSelector((state) => state.authReducer);

    return isAuthenticated;
}