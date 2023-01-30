import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { Text, Card, Button, Divider } from "react-native-paper";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome,
} from "@expo/vector-icons";
import Modal from "react-native-modal";

import { getOrders } from "./redux/Actions";
import OrdersDetail from "./components/OrdersDetail";