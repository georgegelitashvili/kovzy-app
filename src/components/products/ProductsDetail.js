import React, { useState, useEffect, useContext, useCallback } from "react";
import { StyleSheet, View, TouchableOpacity, Dimensions, RefreshControl } from "react-native";
import { Text, Button, Divider, Card } from "react-native-paper";
import { FlatGrid } from "react-native-super-grid";
import { MaterialCommunityIcons, SimpleLineIcons } from "@expo/vector-icons";
import { AuthContext, AuthProvider } from "../../context/AuthProvider";
import Loader from "../generate/loader";
import { String, LanguageContext } from "../Language";
import axiosInstance from "../../apiConfig/apiRequests";

const width = Dimensions.get("window").width;

export default function ProductsDetail({ navigation, route }) {
  const { id } = route.params;
  const [customizable, setCustomizable] = useState([]);
  const { setIsDataSet, domain } = useContext(AuthContext);
  const [options, setOptions] = useState({}); // api options
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false); // api options

  const [isOpen, setOpenState] = useState([]); // my accordion state
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState("");
  const [enabled, setEnabled] = useState("");

  const { dictionary, userLanguage } = useContext(LanguageContext);

  const apiOptions = () => {
    setOptions({
      url_customizable: `https://${domain}/api/getCustomizablePack`,
      url_toggle: `https://${domain}/api/toggleCustomizablePack`,
    });
    setOptionsIsLoaded(true);
  };


  // useEffect(() => {
  //   apiOptions();
  //   if (optionsIsLoaded) {
  //     axiosInstance
  //       .post(options.url_customizable, {
  //         pid: orderId,
  //         lang: userLanguage,
  //       })
  //       .then((resp) => setCustomizable(resp.data.data))
  //       .catch((error) => {
  //         if (error) {
  //           setCustomizable([]);
  //           setIsDataSet(false);
  //         }
  //       });
  //   }
  // }, [optionsIsLoaded, userLanguage, id]);

  useEffect(() => {
    setCustomizable([
      {
        id: 1, product_id: 1, name: "სოუსი", packs: [
          { id: 1, name: 'კეჩუპი', enabled: 0 },
          { id: 2, name: 'მდოგვი', enabled: 0 },
          { id: 3, name: 'მაიონეზი', enabled: 1 },
        ]
      },
      {
        id: 2, product_id: 1, name: "სოუსი 2", packs: [
          { id: 4, name: 'კეჩუპი', enabled: 0 },
          { id: 5, name: 'მდოგვი', enabled: 1 },
          { id: 6, name: 'მაიონეზი', enabled: 1 },
        ]
      },
    ])
  }, []);

  const toggleContent = (value) => {
    setOpenState([...isOpen, value]);

    let index = isOpen.indexOf(value);
    if (index > -1) setOpenState([...isOpen.filter((i) => i !== value)]);
  };

  const renderCustomizableList = ({ item }) => {
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

                    {child.enabled == 1 ? (
                      <Button
                        textColor="white"
                        buttonColor="#f14c4c"
                        style={styles.button}
                        onPress={() => {
                          setValue(item.id);
                          setEnabled(0);
                        }}
                      >
                        {dictionary["prod.disableProduct"]}
                      </Button>
                    ) : (
                      <Button
                        textColor="white"
                        buttonColor="#2fa360"
                        style={styles.button}
                        onPress={() => {
                          setValue(item.id);
                          setEnabled(1);
                        }}
                      >
                        {dictionary["prod.enableProduct"]}
                      </Button>
                    )}
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

  // if (loading) {
  //   return <Loader />;
  // }

  return (
    <>
      <FlatGrid
        itemDimension={width}
        data={customizable || []}
        maxItemsPerRow={4}
        renderItem={renderCustomizableList}
        adjustGridToStyles={true}
        contentContainerStyle={{ justifyContent: "flex-start" }}
        keyExtractor={(item) => item.id}
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
