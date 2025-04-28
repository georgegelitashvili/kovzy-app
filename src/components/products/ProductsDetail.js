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
  const [error, setError] = useState(null);

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
    
    setError(null);
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
        setError('No customizable packs found');
      }
    } catch (error) {
      console.error('Error fetching customizable packs:', error);
      setCustomizable([]);
      
      if (error.response?.status === 404) {
        setError('No customizable packs available');
      } else if (error.response?.status === 401) {
        setIsDataSet(false);
        setError('Authentication failed. Please login again.');
      } else {
        setError(`Failed to fetch data: ${error.response?.data?.error?.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePack = async () => {
    if (!domain || !branchid || !value) return;

    try {
      const response = await axiosInstance.post(
        `https://${domain}/api/v1/admin/customizablePackActivity`,
        {
          product_id: id,
          customizable_id: customizableId,
          customizable_pack_id: value,
          branch_id: branchid
        }
      );

      setProductEnabled(response.data.data);
      fetchData(); // Refresh data after toggle
      setCustomizableId("");
      setValue("");
    } catch (error) {
      console.error('Error toggling pack:', error);
      return;
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
                  buttonColor={child.is_enabled && child.enabled? "#f14c4c" : "#2fa360"}
                  style={styles.button}
                  onPress={() => {
                    setCustomizableId(item.id);
                    setValue(child.id);
                    setEnabled(child.is_enabled ? 0 : 1);
                  }}
                >
                  {child.is_enabled ? dictionary["prod.disableProduct"] : dictionary["prod.enableProduct"]}
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

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          mode="text" 
          onPress={fetchData}
          style={styles.retryButton}
        >
          <MaterialCommunityIcons
            name="reload"
            style={styles.leftIcon}
          />
        </Button>
      </View>
    );
  }

  return (
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 12,
    justifyContent: "flex-start",
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#f14c4c',
  },
  retryButton: {
    marginTop: 10,
  },
});
