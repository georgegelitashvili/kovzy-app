import React, { useState, useEffect, useContext, useCallback, useMemo, memo } from "react";
import { StyleSheet, View, TouchableOpacity, Dimensions, RefreshControl, useWindowDimensions } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, Button, Card, Checkbox } from "react-native-paper";
import { FlatGrid } from "react-native-super-grid";
import SelectOption from "./components/generate/SelectOption";
import { AuthContext } from "./context/AuthProvider";
import Loader from "./components/generate/loader";
import TextField from './components/generate/TextField';
import { LanguageContext } from "./components/Language";
import axiosInstance from "./apiConfig/apiRequests";
import throttle from 'lodash.throttle';
import useErrorDisplay from "./hooks/useErrorDisplay";

const normalizeProductsPayload = (response) => {
  const payload = response?.data?.data ?? response?.data ?? {};
  const category = payload.category ?? [];
  const excluded = payload.excluded ?? [];
  const productsSource = payload.products;

  if (Array.isArray(productsSource)) {
    return {
      category,
      excluded,
      productList: productsSource,
      total: productsSource.length,
      perPage: productsSource.length || 1,
    };
  }

  if (productsSource?.data) {
    return {
      category,
      excluded,
      productList: productsSource.data,
      total: productsSource.total ?? productsSource.data.length,
      perPage: productsSource.per_page ?? (productsSource.data.length || 1),
    };
  }

  return { category, excluded, productList: [], total: 0, perPage: 1 };
};

const MemoizedProductCard = memo(({ item, isExcluded, isExcludedQr, isExcludedOnline, checkedItems, onCheckboxPress, onButtonPress, onNavigate, dictionary }) => {
  const buttonText = isExcluded ? dictionary["prod.enableProduct"] : dictionary["prod.disableProduct"];
  const buttonTextQr = isExcludedQr ? dictionary["prod.enableProductQr"] : dictionary["prod.disableProductQr"];
  const buttonTextOnline = isExcludedOnline ? dictionary["prod.enableProductOnline"] : dictionary["prod.disableProductOnline"];

  return (
    <Card key={item.id} style={styles.card}>
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

      <Card.Actions style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#3490dc" }]}
          onPress={() => onNavigate(item.id)}
        >
          <Text style={styles.buttonText}>
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
          <Text style={styles.buttonText}>
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
          <Text style={styles.buttonText}>
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
          <Text style={styles.buttonText}>
            {buttonTextOnline}
          </Text>
        </TouchableOpacity>
      </Card.Actions>
    </Card>
  );
});

export default function Products({ navigation }) {
  const { width } = useWindowDimensions();
  const { domain, branchid, user, branchEnabled } = useContext(AuthContext);
  const { dictionary, userLanguage } = useContext(LanguageContext);
  const { errorDisplay, setApiError, clearError } = useErrorDisplay({ showInline: true });

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

  // Calculate button width based on screen size
  const buttonWidth = Math.max(80, (width - 30) / 3); // Minimum 80px, but distribute space evenly

  const fetchData = useCallback(async (pageOverride) => {
    if (!user || !domain || !branchid) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const requestPage = pageOverride ?? page;

    try {
      clearError();
      const response = await axiosInstance.post(
        `https://${domain}/api/v1/admin/getProducts`,
        {
          lang: userLanguage,
          page: requestPage,
          categoryid: selected || null,
          branchid: Number(branchid),
          like: searchQuery || null,
        }
      );

      const {
        category: nextCategory,
        excluded: newExcluded,
        productList,
        total,
        perPage,
      } = normalizeProductsPayload(response);

      setCategory(nextCategory);
      setExcluded(newExcluded);

      const updatedProducts = productList.map((product) => ({
        ...product,
        isExcluded: newExcluded.some((item) => item.productid === product.id && item.disabled_by === ""),
        isExcludedQr: newExcluded.some((item) => item.productid === product.id && item.disabled_by === "qr-menu"),
        isExcludedOnline: newExcluded.some((item) => item.productid === product.id && item.disabled_by === "online"),
      }));

      setProducts(updatedProducts);
      setTotalPages(total / perPage);

      if (__DEV__) {
        console.log(`[Products] Loaded ${updatedProducts.length} product(s) for branch ${branchid}`);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setExcluded([]);
      setApiError(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, domain, branchid, userLanguage, page, selected, searchQuery, clearError, setApiError]);

  useEffect(() => {
    const removeSubscription = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return () => { removeSubscription() };
  }, []);

  useEffect(() => {
    if (!user || !domain || !branchid || !isConnected) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setCategory([]);
    fetchData();
  }, [isConnected, page, userLanguage, selected, branchid, searchQuery, fetchData, user, domain]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (!user || !domain || !branchid) return;
      setPage(1);
      setRefreshing(true);
      fetchData(1);
    });

    return unsubscribe;
  }, [navigation, fetchData, user, domain, branchid]);

  useEffect(() => {
    if (!showFilter) {
      setSelected("");
    }
    if (!showSearch) {
      setSearchQuery("");
    }
  }, [showFilter, showSearch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setCheckedItems([]);
  }, [fetchData]);

  const handleSearchChange = useCallback(throttle((query) => {
    if (!branchEnabled) return;
    setSearchQuery(query);
    setPage(1);
  }, 500), [branchEnabled]);

  const handleButtonPress = useCallback(async (item, disabled_by) => {
    if (!domain || !branchid || !branchEnabled) return;

    

    try {
      const response = await axiosInstance.post(
        `https://${domain}/api/v1/admin/productActivity`,
        { pid: item.id, branchid: branchid, disabled_by: disabled_by }
      );

  


      const responseData = response.data.data || response.data;
      const isNowDisabled = responseData && responseData[item.id] === false;

      
      if (isNowDisabled) {
        
        setExcluded(prev => {
         
          const filtered = prev.filter(ex => {
            if (disabled_by === "") {

              return !(ex.productid === item.id && (ex.disabled_by === "" || ex.disabled_by === null));
            } else {

              return !(ex.productid === item.id && ex.disabled_by === disabled_by);
            }
          });

          const disabledByValue = disabled_by === "" ? null : disabled_by;
          return [...filtered, { productid: item.id, disabled_by: disabledByValue }];
        });
      } else {
       
        setExcluded(prev => {
          if (disabled_by === "") {

            return prev.filter(ex => !(ex.productid === item.id && (ex.disabled_by === "" || ex.disabled_by === null)));
          } else {

            return prev.filter(ex => !(ex.productid === item.id && ex.disabled_by === disabled_by));
          }
        });
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

          handleButtonPress(item, ""); // Pass empty string for regular disable/enable
        }
      });
    } else {
      console.log('No items checked');
    }
  }, [branchEnabled, checkedItems, products, handleButtonPress]);

  const handleNavigate = useCallback((id) => {
    navigation.navigate('ProductsDetail', { id });
  }, [navigation]);

  const renderItem = useCallback(({ item }) => {
    const isExcluded = excluded.some((excludedItem) => excludedItem.productid === item.id && (excludedItem.disabled_by === "" || excludedItem.disabled_by === null));
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
      {errorDisplay}
      <View style={styles.buttonContainer}>
        <View style={[styles.buttonWrapper, { width: buttonWidth }]}>
          <Button
            style={styles.filterButton}
            icon={() => (
              <MaterialCommunityIcons name={showFilter ? "close" : "filter"} size={20} color="white" />
            )}
            mode='contained'
            compact
            labelStyle={styles.buttonLabel}
            onPress={() => setShowFilter(prev => !prev)}
          >
            {dictionary["filters"]}
          </Button>
        </View>
        
        <View style={[styles.buttonWrapper, { width: buttonWidth }]}>
          <Button
            style={styles.searchButton}
            icon={() => (
              <MaterialCommunityIcons name={showSearch ? "close" : "magnify"} size={20} color="white" />
            )}
            mode='contained'
            compact
            labelStyle={styles.buttonLabel}
            onPress={() => setShowSearch(prev => !prev)}
          >
            {dictionary["search"]}
          </Button>
        </View>
        
        <View style={[styles.buttonWrapper, { width: buttonWidth }]}>
          <Button
            style={styles.markButton}
            icon={() => (
              <MaterialCommunityIcons name={"dip-switch"} size={20} color="white" />
            )}
            mode='contained'
            compact
            labelStyle={styles.buttonLabel}
            onPress={checkboxPressed}
          >
            On/Off
          </Button>
        </View>
      </View>

      <View style={{ paddingHorizontal: 10 }}>
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
    paddingHorizontal: 10,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
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
    transform: [{ scale: 1.5 }],
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  buttonWrapper: {
    marginHorizontal: 2,
  },
  buttonLabel: {
    fontSize: 12,
  },
  filterButton: {
    backgroundColor: '#3490dc',
    paddingHorizontal: 4,
  },
  searchButton: {
    backgroundColor: '#3490dc',
    paddingHorizontal: 4,
  },
  markButton: {
    backgroundColor: '#3490dc',
    paddingHorizontal: 4,
  },
});