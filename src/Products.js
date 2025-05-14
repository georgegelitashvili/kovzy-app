import React, { useState, useEffect, useContext, useCallback, useMemo, memo } from "react";
import { StyleSheet, View, TouchableOpacity, Dimensions, RefreshControl, Alert } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, Button, Card, Checkbox } from "react-native-paper";
import { useIsFocused } from '@react-navigation/native';
import { FlatGrid } from "react-native-super-grid";
import SelectOption from "./components/generate/SelectOption";
import { AuthContext } from "./context/AuthProvider";
import Loader from "./components/generate/loader";
import TextField from './components/generate/TextField';
import { LanguageContext } from "./components/Language";
import axiosInstance from "./apiConfig/apiRequests";
import throttle from 'lodash.throttle';

const width = Dimensions.get("window").width;

const MemoizedProductCard = memo(({ item, isExcluded, isExcludedQr,isExcludedOnline,checkedItems, onCheckboxPress, onButtonPress, onNavigate, dictionary }) => {
  const buttonText = isExcluded ? dictionary["prod.enableProduct"] : dictionary["prod.disableProduct"];
  const buttonTextQr = isExcludedQr ? dictionary["prod.enableProductQr"] : dictionary["prod.disableProductQr"];
  const buttonTextOnline = isExcludedOnline ? dictionary["prod.enableProductOnline"] : dictionary["prod.disableProductOnline"];

  return (
    <Card key={item.id}>
      <Card.Content style={styles.cardContent}>
        <Text variant="titleMedium" style={styles.title}>
          {item.name}
        </Text>
        <Checkbox
          status={checkedItems.includes(item.id) ? 'checked' : 'unchecked'}
          color='#3490dc'
          onPress={() => onCheckboxPress(item.id)}
          style={styles.checkbox}
        />
      </Card.Content>

      <Card.Actions>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#3490dc" }]}
          onPress={() => onNavigate(item.id)}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "500" }}>
            {dictionary["prod.ingredients"]}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isExcluded ? "#2fa360" : "#f14c4c" }
          ]}
          onPress={() => onButtonPress(item, "")}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "500" }}>
            {buttonText}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isExcludedQr ? "#2fa360" : "#f14c4c" }
          ]}
          onPress={() => onButtonPress(item, "qr-menu")}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "500" }}>
            {buttonTextQr}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isExcludedOnline ? "#2fa360" : "#f14c4c" }
          ]}
          onPress={() => onButtonPress(item, "online")}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "500" }}>
            {buttonTextOnline}
          </Text>
        </TouchableOpacity>
      </Card.Actions>
    </Card>
  );
});

export default function Products({ navigation }) {
  const { setIsDataSet, domain, branchid, user, intervalId, branchEnabled } = useContext(AuthContext);
  const isFocused = useIsFocused();
  const { dictionary, userLanguage } = useContext(LanguageContext);

  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [excluded, setExcluded] = useState([]);
  const [selected, setSelected] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [checkedItems, setCheckedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    if (!user || !domain || !branchid || !branchEnabled) return;

    try {
      const response = await axiosInstance.post(
        `https://${domain}/api/v1/admin/getProducts`,
        {
          lang: userLanguage,
          page: page,
          categoryid: selected,
          branchid: branchid,
          like: searchQuery
        }
      );

      setCategory(response.data.category);
      const newExcluded = response.data.excluded || [];
      setExcluded(newExcluded);

      const updatedProducts = response.data.products.data.map(product => ({
        ...product,
        isExcluded: newExcluded.some(item => item.productid === product.id && item.disabled_by === ""),
        isExcludedQr: newExcluded.some(item => item.productid === product.id && item.disabled_by === "qr-menu"),
        isExcludedOnline: newExcluded.some(item => item.productid === product.id && item.disabled_by === "online"),
      }));
      
      setProducts(updatedProducts);

      setTotalPages(response.data.products.total / response.data.products.per_page);
    } catch (error) {
      console.error('Error fetching products:', error);
      if (error.status === 401) {
        setProducts([]);
        setExcluded([]);
        setIsDataSet(false);
        clearInterval(intervalId);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, domain, branchid, branchEnabled, userLanguage, page, selected, searchQuery, setIsDataSet, intervalId]);

  useEffect(() => {
    const removeSubscription = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return () => { removeSubscription() };
  }, []);

  useEffect(() => {
    if (isConnected && (page || userLanguage || selected || searchQuery) && branchEnabled) {
      setLoading(true);
      setCategory([]);
      fetchData();
    }
  }, [isConnected, page, userLanguage, selected, branchid, searchQuery, branchEnabled, fetchData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (branchEnabled) {
        setPage(1);
        setRefreshing(true);
        fetchData();
      }
    });

    return unsubscribe;
  }, [navigation, branchEnabled, fetchData]);

  useEffect(() => {
    if (!showFilter) {
      setSelected("");
    }
    if (!showSearch) {
      setSearchQuery("");
    }
  }, [showFilter, showSearch]);

  const onRefresh = useCallback(async () => {
    if (!branchEnabled) return;
    setRefreshing(true);
    await fetchData();
    setCheckedItems([]);
  }, [branchEnabled, fetchData]);

  const handleSearchChange = useCallback(throttle((query) => {
    if (!branchEnabled) return;
    setSearchQuery(query);
    setPage(1);
  }, 500), [branchEnabled]);

  const handleButtonPress = useCallback(async (item,disabled_by) => {
    if (!domain || !branchid || !branchEnabled) return;

    try {
      const response = await axiosInstance.post(
        `https://${domain}/api/v1/admin/productActivity`,
        { pid: item.id, branchid: branchid, disabled_by: disabled_by }
      );

      const isAlreadyDisabled = excluded.some((excludedItem) => excludedItem.productid === item.id && excludedItem.disabled_by === disabled_by);
      
      if (isAlreadyDisabled) {
        setExcluded(prev => prev.filter(ex => !(ex.productid === item.id && ex.disabled_by === disabled_by)));
      } else {
        setExcluded(prev => [...prev, { productid: item.id, disabled_by }]);
      }
      
      
      onRefresh();
    } catch (error) {
      console.error('Error updating product activity:', error);
    }
  }, [domain, branchid, branchEnabled, excluded, onRefresh]);

  const handleCheckboxPress = useCallback((id) => {
    if (!branchEnabled) return;
    setCheckedItems((prevState) => {
      if (prevState.includes(id)) {
        return prevState.filter((item) => item !== id);
      } else {
        return [...prevState, id];
      }
    });
  }, [branchEnabled]);

  const checkboxPressed = useCallback(() => {
    if (!branchEnabled) return;
    if (checkedItems.length > 0) {
      checkedItems.forEach(id => {
        const item = products.find(item => item.id === id);
        if (item) {
          handleButtonPress(item);
        }
      });
    }
  }, [branchEnabled, checkedItems, products, handleButtonPress]);

  const handleNavigate = useCallback((id) => {
    navigation.navigate('ProductsDetail', { id });
  }, [navigation]);

  const renderItem = useCallback(({ item }) => {
    const isExcluded = excluded.some((excludedItem) => excludedItem.productid === item.id && excludedItem.disabled_by === null);
    const isExcludedQr = excluded.some((excludedItem) => excludedItem.productid === item.id && excludedItem.disabled_by === "qr-menu");
    const isExcludedOnline = excluded.some((excludedItem) => excludedItem.productid === item.id && excludedItem.disabled_by === "online");
    return (
      <MemoizedProductCard
        item={item}
        isExcluded={isExcluded}
        isExcludedQr={isExcludedQr}
        isExcludedOnline={isExcludedOnline}
        checkedItems={checkedItems}
        onCheckboxPress={handleCheckboxPress}
        onButtonPress={handleButtonPress}
        onNavigate={handleNavigate}
        dictionary={dictionary}
      />
    );
  }, [excluded, checkedItems, handleCheckboxPress, handleButtonPress, handleNavigate, dictionary]);

  const categoryItems = useMemo(() => 
    category.map((item) => ({ label: item.name, value: item.id }))
  , [category]);

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <View style={styles.buttonContainer}>
        <Button
          style={styles.filterButton}
          icon={() => (
            <MaterialCommunityIcons name={showFilter ? "close" : "filter"} size={24} color="white" />
          )}
          mode='contained'
          size={35}
          onPress={() => setShowFilter(prev => !prev)}
        >
          {dictionary["filters"]}
        </Button>
        <Button
          style={styles.searchButton}
          icon={() => (
            <MaterialCommunityIcons name={showSearch ? "close" : "magnify"} size={24} color="white" />
          )}
          mode='contained'
          size={35}
          onPress={() => setShowSearch(prev => !prev)}
        >
          {dictionary["search"]}
        </Button>
        <Button
          style={styles.markButton}
          icon={() => (
            <MaterialCommunityIcons name={"dip-switch"} size={24} color="white" />
          )}
          mode='contained'
          size={35}
          onPress={checkboxPressed}
        >
          On/Off
        </Button>
      </View>

      <View style={{ paddingLeft: 10, paddingRight: 10 }}>
        {showSearch && (
          <TextField
            placeholder="Search..."
            editable={true}
            clearButtonMode='always'
            autoCapitalize="none"
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
        )}
        {showFilter && (
          <SelectOption
            value={selected}
            onValueChange={setSelected}
            items={categoryItems}
          />
        )}
      </View>

      <FlatGrid
        itemDimension={width}
        data={products}
        maxItemsPerRow={4}
        renderItem={renderItem}
        adjustGridToStyles={true}
        contentContainerStyle={{ justifyContent: "flex-start" }}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        extraData={[excluded, checkedItems]}
        initialNumToRender={10}
        windowSize={5}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={true}
        getItemLayout={(data, index) => ({
          length: 200,
          offset: 200 * index,
          index,
        })}
      />

      <View style={styles.paginationContainer}>
        <TouchableOpacity
          onPress={() => setPage(page - 1)}
          disabled={page === 1 || !branchEnabled}
        >
          <Text
            style={[
              styles.paginationButton,
              (page === 1 || !branchEnabled) && styles.paginationButtonDisabled,
            ]}
          >
            {dictionary["prevPage"]}
          </Text>
        </TouchableOpacity>
        <Text style={styles.paginationText}>{page}</Text>
        <TouchableOpacity
          onPress={() => setPage(page + 1)}
          disabled={page === Math.ceil(totalPages) || !branchEnabled}
        >
          <Text
            style={[
              styles.paginationButton,
              (page === Math.ceil(totalPages) || !branchEnabled) && styles.paginationButtonDisabled,
            ]}
          >
            {dictionary["nextPage"]}
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
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 18, // Rounded corners like Paper's Button
    shadowColor: "#000", // Add shadow for elevation
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3, // Elevation for Android
    justifyContent: "center",
    alignItems: "center",
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
  checkbox: {
    transform: [{ scale: 2 }],
    fontSize: 17,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
  },
  searchButton: {
    marginLeft: 5,
    backgroundColor: '#3490dc'
  },
  filterButton: {
    marginLeft: 5,
    backgroundColor: '#3490dc'
  },
  markButton: {
    marginLeft: 5,
    backgroundColor: '#3490dc'
  },
});