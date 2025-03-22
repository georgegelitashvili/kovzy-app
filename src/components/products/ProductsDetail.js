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
  const [productEnabled, setProductEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isOpen, setOpenState] = useState([]);
  const [value, setValue] = useState("");
  const [enabled, setEnabled] = useState("");

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
    if (value && enabled) {
      handleTogglePack();
    }
  }, [value, enabled]);

  const fetchData = async () => {
    if (!domain || !branchid) return;
    
    try {
      const response = await axiosInstance.post(
        `https://${domain}/api/v1/admin/getCustomizablePack`,
        {
          pid: id,
          lang: userLanguage,
        }
      );
      setCustomizable(response.data.customizable);
    } catch (error) {
      console.error('Error fetching customizable packs:', error);
      if (error.status === 401) {
        setCustomizable([]);
        setIsDataSet(false);
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
          customizablePackid: value, 
          enabled: enabled, 
          branchid: branchid 
        }
      );
      setProductEnabled(response.data.data);
      fetchData(); // Refresh data after toggle
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

  const handlePackButtonPress = (packId, packEnabled) => {
    setValue(packId);
    setEnabled(packEnabled ? 0 : 1);
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
          <Card.Content key={index + 1}>
            <View>
              <View style={{ flexDirection: 'row', justifyContent: "space-between" }}>
                <Text variant="titleMedium" style={styles.title}>
                  {child.name}
                </Text>
                <Button
                  textColor="white"
                  buttonColor={child.enabled ? "#f14c4c" : "#2fa360"}
                  style={styles.button}
                  onPress={() => handlePackButtonPress(child.id, child.enabled)}
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
});
