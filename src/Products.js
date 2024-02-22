import React, { useState, useEffect, useContext, useCallback } from "react";
import { StyleSheet, View, TouchableOpacity, Dimensions, RefreshControl } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { Text, Button, Divider, Card } from "react-native-paper";
import { useIsFocused } from '@react-navigation/native';
import { FlatGrid } from "react-native-super-grid";
import SelectOption from "./components/generate/SelectOption";
import { AuthContext, AuthProvider } from "./context/AuthProvider";
import Loader from "./components/generate/loader";
import { String, LanguageContext } from "./components/Language";
import axiosInstance from "./apiConfig/apiRequests";

const width = Dimensions.get("window").width;

export default function Products({ navigation }) {
  const { setIsDataSet, domain, branchid } = useContext(AuthContext);
  const isFocused = useIsFocused();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [excluded, setExcluded] = useState([]);
  const [productData, setProductData] = useState({});
  const [isConnected, setIsConnected] = useState(true);

  const [selected, setSelected] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [options, setOptions] = useState({
    url_getProducts: "",
    url_productActivity: "",
  }); // api options
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false); // api options
  const [activityOptions, setActivityOptions] = useState({});
  const [sendApi, setSendApi] = useState(false);
  const [sendEnabled, setSendEnabled] = useState(false);
  const [enabled, setEnabled] = useState(null);
  const [value, setValue] = useState(null);
  const [productEnabled, setProductEnabled] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { dictionary, userLanguage } = useContext(LanguageContext);


  const apiOptions = () => {
    setOptions({
      url_getProducts: `https://${domain}/api/v1/admin/getProducts`,
      url_productActivity: `https://${domain}/api/v1/admin/productActivity`,
    });

    setOptionsIsLoaded(true);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      onRefresh();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (domain) {
      apiOptions();
    }
  }, [domain]);

  useEffect(() => {
    const removeSubscription = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return () => { removeSubscription() };
  }, []);

  useEffect(() => {
    if (optionsIsLoaded && (page || userLanguage || selected)) {
      setProductData((prev) => ({
        ...prev,
        data: {
          lang: userLanguage,
          page: page,
          categoryid: selected,
          branchid: branchid
        }
      }));
      setSendApi(true);
      setLoading(true);
      setCategory([]);
    }
  }, [page, userLanguage, selected, optionsIsLoaded]);

  useEffect(() => {
    if (isFocused && sendApi || isConnected) {
      fetchData();
      setSendApi(false);
    }
  }, [sendApi, isConnected, isFocused]);

  useEffect(() => {
    setExcluded([]);
    if (value || enabled) {
      setActivityOptions((prev) => ({
        ...prev,
        data: { pid: value, branchid: branchid },
      }));
      setSendEnabled(true);
    }
  }, [value, enabled, branchid]);

  useEffect(() => {
    if (sendEnabled || isConnected) {
      axiosInstance.post(options.url_productActivity, activityOptions.data);
      setLoading(true);
      setProductEnabled(true);
      setSendEnabled(false);
      setActivityOptions({});
    }
  }, [sendEnabled, isConnected]);

  useEffect(() => {
    if (productEnabled || isConnected) {
      fetchData();
      setProductEnabled(false);
      setSendApi(false);
    }
  }, [productEnabled, isConnected]);


  const fetchData = () => {
    setExcluded([]);
    axiosInstance
      .post(options.url_getProducts, productData.data)
      .then(resp => {
        resp.data.category?.map((item) => {
          if (item.name != null) {
            setCategory((prev) => [
              ...prev,
              { label: item.name, value: item.id },
            ])
          }
        });

        if (resp.data.excluded) {
          resp.data.excluded?.map((item) => {
            setExcluded((prev) => [...prev, item.productid])
          });
        }

        setLoading(false);
        setProducts(resp.data.data.data);
        setTotalPages(resp.data.data.total / resp.data.data.per_page);
      }).catch((error) => {
        console.log('Error fetching products:', error)
        if (error.status == 401) {
          setProducts([]);
          setExcluded([]);
          setIsDataSet(false);
        }
      });
    setRefreshing(false);
  }

  const onRefresh = () => {
    setRefreshing(true);
    setLoading(true);
    setProducts([]);
    setExcluded([]);
    fetchData();
    setSendApi(false);
  };


  const renderProductList = ({ item }) => {
    return (
      <Card key={item.index}>
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium" style={styles.title}>
            {item.name}
          </Text>
        </Card.Content>

        <Card.Actions>
          <Button
            textColor="white"
            buttonColor="#3490dc"
            style={styles.button}
            onPress={() => navigation.navigate('ProductsDetail', { id: item.id })}
          >
            {dictionary["prod.ingredients"]}
          </Button>

          {excluded.includes(item.id) ? (
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
            ) : (
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
            )
          }
        </Card.Actions>
      </Card>
    );
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <View style={{ paddingLeft: 10, paddingRight: 10 }}>
        <SelectOption
          value={selected}
          onValueChange={(value) => {
            setSelected(value);
          }}
          items={category || []}
          key={(item) => item?.id || 1}
        />
      </View>
      <FlatGrid
        itemDimension={width}
        data={products}
        maxItemsPerRow={4}
        renderItem={renderProductList}
        adjustGridToStyles={true}
        contentContainerStyle={{ justifyContent: "flex-start" }}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <View style={styles.paginationContainer}>
        <TouchableOpacity
          onPress={() => {
            setPage(page - 1);
          }}
          disabled={page === 1}
        >
          <Text
            style={[
              styles.paginationButton,
              page === 1 && styles.paginationButtonDisabled,
            ]}
          >
            Prev
          </Text>
        </TouchableOpacity>
        <Text style={styles.paginationText}>{page}</Text>
        <TouchableOpacity
          onPress={() => {
            setPage(page + 1);
          }}
          disabled={page === Math.ceil(totalPages)}
        >
          <Text
            style={[
              styles.paginationButton,
              page === Math.ceil(totalPages) && styles.paginationButtonDisabled,
            ]}
          >
            Next
          </Text>
        </TouchableOpacity>
      </View>
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

    margin: 15,
    paddingVertical: 5,
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
  button: {
    fontSize: 13,
    marginTop: 25,
    padding: 1,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    marginBottom: 15,
  },
  paginationButton: {
    backgroundColor: "#ccc",
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginHorizontal: 5,
    borderRadius: 5,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationText: {
    fontSize: 17,
    fontWeight: "bold",
  },
});
