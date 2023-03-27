import React, { useState, useContext, useEffect, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { DrawerItem, DrawerContentScrollView } from "@react-navigation/drawer";
import { Drawer, Text, TouchableRipple, Switch } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { authorized } from "../redux/Actions";
import { useDispatch, useSelector } from "react-redux";
import { storeData, getData } from '../helpers/storage';


export default function authorizedLegal(props)
{
    const { authorized } = useSelector((state) => state.authReducer);

    
}