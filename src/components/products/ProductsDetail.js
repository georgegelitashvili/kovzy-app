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
  const [customizable, setCustomizable] = useState([]);
  const [options, setOptions] = useState({}); // api options
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false); // api options
  const [productEnabled, setProductEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [sendEnabled, setSendEnabled] = useState(false);
  const [sendApi, setSendApi] = useState(false);

  const [isOpen, setOpenState] = useState([]); // my accordion state
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState("");
  const [enabled, setEnabled] = useState("");

  const { dictionary, userLanguage } = useContext(LanguageContext);

  const apiOptions = () => {
    setOptions({
      url_customizable: `https://${domain}/api/v1/admin/getCustomizablePack`,
      url_toggle: `https://${domain}/api/v1/admin/customizablePackActivity`,
    });
    setOptionsIsLoaded(true);
  };

  useEffect(() => {
    const removeSubscription = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return () => { removeSubscription() };
  }, []);

  useEffect(() => {
    apiOptions();
    if (optionsIsLoaded) {
      setSendApi(true);
    }
  }, [optionsIsLoaded, userLanguage, id]);


  useEffect(() => {
    if (sendApi || isConnected) {
      if (options.url_customizable) {
        fetchData();
      }
      setSendApi(false);
    }
  }, [sendApi, isConnected, options.url_customizable]);

  useEffect(() => {
    if (value) {
      setSendEnabled(true);
    }
  }, [value, enabled]);

  useEffect(() => {
    if (sendEnabled || isConnected) {
      axiosInstance.post(options.url_toggle, { customizablePackid: value, enabled: enabled, branchid: branchid });
      setLoading(true);
      setProductEnabled(true);
      setSendEnabled(false);
    }
  }, [sendEnabled, isConnected]);

  useEffect(() => {
    if (productEnabled || isConnected) {
      if (options.url_customizable) {
        fetchData();
      }
      setProductEnabled(false);
      setSendApi(false);
    }
  }, [productEnabled, isConnected, options.url_customizable]);


  const fetchData = () => {
    if (!options.url_customizable) {
      console.error("URL for customizable is not set.");
      return;
    }
    
    axiosInstance
      .post(options.url_customizable, {
        pid: id,
        lang: userLanguage,
      })
      .then((resp) => {
        setCustomizable(resp.data.customizable);
        setLoading(false);
      })
      .catch((error) => {
        if (error) {
          setCustomizable([]);
          setIsDataSet(false);
        }
      });
  }


  const toggleContent = (value) => {
    setOpenState((prev) =>
      prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value]
    );
  };

  const handlePackButtonPress = (packId, packEnabled) => {
    // Update API
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
        {!isOpen.includes(item.id) ? (
          item.packs?.map((child, index) => {
            return (
              <Card.Content key={index + 1}>
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: "space-between", }}>
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
            )
          })
        ) : null}
      </Card>
    );
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <>
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
    </>
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
