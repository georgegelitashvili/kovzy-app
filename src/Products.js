import React, { useState, useEffect, useContext, useCallback } from "react";
import { StyleSheet, View, TouchableOpacity, Dimensions, RefreshControl, ActivityIndicator } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { Text, Button, Divider, Card } from "react-native-paper";
import { useIsFocused } from '@react-navigation/native';
import { FlatGrid } from "react-native-super-grid";
import SelectOption from "./components/generate/SelectOption";
import { AuthContext } from "./context/AuthProvider";
import Loader from "./components/generate/loader";
import { LanguageContext } from "./components/Language";
import axiosInstance from "./apiConfig/apiRequests";

const width = Dimensions.get("window").width;

export default function Products({ navigation }) {
  const { setIsDataSet, domain, branchid } = useContext(AuthContext);
  const isFocused = useIsFocused();
  const { dictionary, userLanguage } = useContext(LanguageContext);

  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [excluded, setExcluded] = useState([]);
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [productEnabled, setProductEnabled] = useState(false);

  const [options, setOptions] = useState({
    url_getProducts: "",
    url_productActivity: "",
  }); // api options

  const fetchData = async () => {
    try {
      if (!options.url_getProducts) {
        throw new Error("URL is empty");
      }
      const response = await axiosInstance.post(options.url_getProducts, {
        lang: userLanguage,
        page: page,
        categoryid: selected,
        branchid: branchid
      });
      setCategory(response.data.category);

      // Update excluded products
      const newExcluded = response.data.excluded || [];
      setExcluded(newExcluded);

      // Update products
      const updatedProducts = response.data.data.data.map(product => ({
        ...product,
        isExcluded: newExcluded.includes(product.id) // Add isExcluded property to each product
      }));
      setProducts(updatedProducts);

      setTotalPages(response.data.data.total / response.data.data.per_page);
    } catch (error) {
      console.log('Error fetching products:', error);
      if (error.status == 401) {
        setProducts([]);
        setExcluded([]);
        setIsDataSet(false);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (domain) {
      setOptions({
        url_getProducts: `https://${domain}/api/v1/admin/getProducts`,
        url_productActivity: `https://${domain}/api/v1/admin/productActivity`,
      });
    }
  }, [domain]);

  useEffect(() => {
    const removeSubscription = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return () => { removeSubscription() };
  }, []);

  useEffect(() => {
    if (isConnected && (page || userLanguage || selected)) {
      setLoading(true);
      setCategory([]);
      fetchData();
    }
  }, [page, userLanguage, selected, options, isConnected, branchid, setIsDataSet]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setPage(1);
      setRefreshing(true);
      fetchData(); // Call fetchData when component is focused
    });

    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setPage(1);
    setRefreshing(true);
    fetchData(); // Call fetchData when refreshing
  };


  const handleButtonPress = (item) => {
    const isAlreadyDisabled = excluded.some((excludedItem) => excludedItem.productid === item.id);

    axiosInstance.post(options.url_productActivity, { pid: item.id, branchid: branchid })
      .then((resp) => {
        setLoading(false);
        setProductEnabled(true);
        if (isAlreadyDisabled) {
          // Product is already excluded, so remove it from the excluded list
          setExcluded(prevExcluded => prevExcluded.filter(id => id !== item.id));
        } else {
          // Product is not excluded, so add it to the excluded list
          setExcluded(prevExcluded => [...prevExcluded, item.id]);
        }
        onRefresh();
      })
      .catch(error => {
        console.error('Error updating product activity:', error);
        setLoading(false); // Ensure loading state is updated even if there's an error
      });
  };



  const renderProductList = ({ item }) => {
    const isExcluded = excluded.some((excludedItem) => excludedItem.productid === item.id);
    const isDisabled = isExcluded; // Assuming exclusion implies disabled status

    const buttonColor = isDisabled ? "#2fa360" : "#f14c4c";
    const buttonText = isDisabled ? dictionary["prod.enableProduct"] : dictionary["prod.disableProduct"];

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

          <Button
            textColor="white"
            buttonColor={buttonColor}
            style={styles.button}
            onPress={() => handleButtonPress(item)}
          >
            {buttonText}
          </Button>
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
          onValueChange={setSelected}
          items={category.map((item) => ({ label: item.name, value: item.id }))}
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
        initialNumToRender={10} // Adjust this number based on your performance needs
        windowSize={5} // Adjust this number based on your performance needs
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
    flex: 1,
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
