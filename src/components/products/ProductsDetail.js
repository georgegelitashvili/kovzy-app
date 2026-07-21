import React, { useState, useEffect, useContext } from "react";
import { StyleSheet, View, TouchableOpacity, Dimensions } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { Text, Button, Divider, Card } from "react-native-paper";
import { FlatGrid } from "react-native-super-grid";
import { MaterialCommunityIcons, SimpleLineIcons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthProvider";
import Loader from "../generate/loader";
import { LanguageContext } from "../Language";
import axiosInstance from "../../apiConfig/apiRequests";
import ErrorDisplay from "../generate/ErrorDisplay";
import useErrorHandler from "../../hooks/useErrorHandler";
import { eventEmitter } from "../../utils/EventEmitter";

const width = Dimensions.get("window").width;

export default function ProductsDetail({ navigation, route }) {
  const { id } = route.params;
  const { setIsDataSet, domain, branchid } = useContext(AuthContext);
  const { dictionary, userLanguage } = useContext(LanguageContext);
  
  const [customizable, setCustomizable] = useState([]);
  const [customizableId, setCustomizableId] = useState('');
  const [productEnabled, setProductEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isOpen, setOpenState] = useState([]);
  const [value, setValue] = useState("");
  const [enabled, setEnabled] = useState("");
  const [isToggling, setIsToggling] = useState(false);
  const { error, setError, setApiError, clearError } = useErrorHandler();

  useEffect(() => {
    const removeSubscription = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return () => { removeSubscription() };
  }, []);

  useEffect(() => {
    if (isConnected && domain && branchid) {
      fetchData();
    }
  }, [isConnected, domain, branchid, userLanguage, id]);

  useEffect(() => {
    handleTogglePack();
  }, [value, customizableId, enabled]);
  const fetchData = async () => {
    if (!domain || !branchid) return;
    
    clearError();
    setLoading(true);
    
    try {
      const response = await axiosInstance.post(
        `https://${domain}/api/v1/admin/getCustomizablePack`,
        {
          branch_id: branchid,
          pid: id,
          lang: userLanguage,
        }
      );

      if (response.data?.customizable) {
        setCustomizable(response.data.customizable);
      } else {
        setCustomizable([]);
        // Don't show error for empty results - this might be normal
        console.log('No customizable packs found for this product');
      }
    } catch (error) {
      console.error('Error fetching customizable packs:', error);
      setCustomizable([]);
      
      // Handle different error types more specifically
      if (error.type && error.message) {
        // This is a formatted API error from our interceptor
        setApiError(error);
      } else if (error.response?.status === 404) {
        // 404 might be normal if no customizables exist for this product
        console.log('No customizable packs available for this product');
        setCustomizable([]);
      } else if (error.response?.status === 401) {
        setIsDataSet(false);
        setError('UNAUTHORIZED', 'Authentication failed. Please login again.');
      } else if (error.response?.status === 403) {
        setError('FORBIDDEN', 'You do not have permission to view customizable packs.');
      } else if (error.response?.status >= 500) {
        setError('SERVER_ERROR', 'Server error occurred while fetching customizable packs.');
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        setError('NETWORK_ERROR', 'Network connection issue. Please check your internet connection.');
      } else {
        // Generic error handling
        const errorMessage = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           error.message || 
                           'Failed to fetch customizable packs. Please try again.';
        setError('SERVER_ERROR', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };  const handleTogglePack = async () => {
    if (!domain || !branchid || !value) return;
    
    clearError();
    setIsToggling(true);
    
    try {
      const response = await axiosInstance.post(
        `https://${domain}/api/v1/admin/customizablePackActivity`,
        {
          product_id: id,
          customizable_id: customizableId,
          customizablePackid: value,
          branch_id: branchid,
          enabled: enabled,
        }
      );

      // Check if response is successful and has expected data structure
      if (response && response.data) {
        // Update local state immediately for better UX
        setCustomizable(prevCustomizable => 
          prevCustomizable.map(customizable => ({
            ...customizable,
            packs: customizable.packs.map(pack => 
              pack.id === value 
                ? { ...pack, enabled: enabled === 1 }
                : pack
            )
          }))
        );
        
        setProductEnabled(response.data.data);
        
        // Show success notification
        const successMessage = enabled === 1 
          ? (dictionary["prod.customizableEnabled"] || "Customizable pack enabled successfully")
          : (dictionary["prod.customizableDisabled"] || "Customizable pack disabled successfully");
        
        eventEmitter.emit("showToast", {
          type: "success",
          title: dictionary?.["info.success"] || "Success",
          subtitle: successMessage
        });
        
        // Only refresh data if the response doesn't contain the updated data
        if (!response.data.customizable) {
          fetchData();
        }
      } else {
        // If response is empty or malformed, refresh data
        fetchData();
      }
      
      setCustomizableId("");
    } catch (error) {
      console.error('Error toggling pack:', error);
      
      // Handle different types of errors more gracefully
      if (error.type && error.message) {
        // This is a formatted API error from our interceptor
        setApiError(error);
      } else if (error.response?.status === 401) {
        setError('UNAUTHORIZED', 'Authentication failed. Please login again.');
        setIsDataSet(false);
      } else if (error.response?.status === 404) {
        setError('NOT_FOUND', 'Customizable pack not found. Please refresh and try again.');
      } else if (error.response?.status === 403) {
        setError('FORBIDDEN', 'You do not have permission to modify this customizable pack.');
      } else if (error.response?.status >= 500) {
        setError('SERVER_ERROR', 'Server error occurred. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        // Network errors are handled by the interceptor, but we can add a fallback
        setError('NETWORK_ERROR', 'Network connection issue. Please check your internet connection.');
      } else {
        // Generic error handling
        const errorMessage = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           error.message || 
                           'Failed to update customizable pack. Please try again.';
        setError('SERVER_ERROR', errorMessage);
      }
      
      // Refresh data on error to ensure UI is in sync
      fetchData();
    } finally {
      setIsToggling(false);
      setValue("");
    }
  };

  const toggleContent = (value) => {
    setOpenState((prev) =>
      prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value]
    );
  };

  const RenderCustomizableList = ({ item }) => {
    return (
      <Card key={item.id}>
        <TouchableOpacity onPress={() => toggleContent(item.id)}>
          <Card.Content style={styles.head}>
            <Text variant="headlineMedium" style={styles.header}>
              <MaterialCommunityIcons
                name="music-accidental-sharp"
                style={styles.leftIcon}
              />
              {item.name}
            </Text>
            <Text variant="headlineMedium" style={styles.header}>
              <SimpleLineIcons
                name={!isOpen.includes(item.id) ? "arrow-up" : "arrow-down"}
                style={styles.rightIcon}
              />
            </Text>
          </Card.Content>
        </TouchableOpacity>
        {!isOpen.includes(item.id) && item.packs?.map((child, index) => (
          <Card.Content key={index + item.id + child.id}>
            <View>
              <View style={{ flexDirection: 'row', justifyContent: "space-between" }}>
                <Text variant="titleMedium" style={styles.title}>
                  {child.name}
                </Text>
                <Button
                  textColor="white"
                  buttonColor={child.enabled? "#f14c4c" : "#2fa360"}
                  style={styles.button}
                  loading={isToggling && value === child.id}
                  disabled={isToggling || loading}
                  onPress={() => {
                    if (!isToggling && !loading) {
                      setCustomizableId(item.id);
                      setValue(child.id);
                      setEnabled(child.enabled ? 0 : 1);
                    }
                  }}
                >
                  {child.enabled ? dictionary["prod.disableProduct"] : dictionary["prod.enableProduct"]}
                </Button>
              </View>
              <Divider style={{ marginVertical: 9 }} />
            </View>
          </Card.Content>
        ))}
      </Card>
    );
  };
  if (loading) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
      <ErrorDisplay 
        error={error} 
        onDismiss={clearError} 
        style={styles.errorDisplay} 
      />
      <FlatGrid
        itemDimension={width}
        data={customizable || []}
        maxItemsPerRow={4}
        renderItem={({ item }) => <RenderCustomizableList item={item} />}
        adjustGridToStyles={true}
        contentContainerStyle={{ justifyContent: "flex-start" }}
        keyExtractor={(item) => item.id.toString()}
        removeClippedSubviews={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 12,
    justifyContent: "flex-start",
  },
  errorDisplay: {
    zIndex: 1000,
    width: '92%',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: "#fff",
    justifyContent: "flex-start",
    margin: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  header: {
    paddingVertical: 10,
  },
  leftIcon: {
    marginRight: 3,
    fontSize: 23,
  },
  rightIcon: {
    marginRight: 15,
    fontSize: 25,
  },
  title: {
    paddingVertical: 1,
  },
  button: {
    fontSize: 10,
    padding: 0,
  },
});
