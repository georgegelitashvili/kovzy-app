import React, { useState, useEffect, useContext, useCallback, useMemo, memo, useRef } from "react";
import { StyleSheet, View, TouchableOpacity, Dimensions, RefreshControl, useWindowDimensions, Alert } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, Button, Card, Checkbox, Chip } from "react-native-paper";
import { FlatGrid } from "react-native-super-grid";
import SelectOption from "./components/generate/SelectOption";
import { AuthContext } from "./context/AuthProvider";
import Loader from "./components/generate/loader";
import TextField from './components/generate/TextField';
import { LanguageContext } from "./components/Language";
import axiosInstance from "./apiConfig/apiRequests";
import throttle from 'lodash.throttle';
import useErrorDisplay from "./hooks/useErrorDisplay";
import ProductsBulkActivityModal from "./components/modal/ProductsBulkActivityModal";

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

  if (Array.isArray(productsSource?.data)) {
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

// null / "" = all channels. "0" is legacy from API casting disabled_by to int.
const isAllChannelsExcluded = (disabledBy) =>
  disabledBy === "" || disabledBy === null || disabledBy === "0" || disabledBy === 0;

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
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categoryPickerKey, setCategoryPickerKey] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [checkedItems, setCheckedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const fetchRequestIdRef = useRef(0);

  // Calculate button width based on screen size
  const buttonWidth = Math.max(80, (width - 30) / 3); // Minimum 80px, but distribute space evenly

  const fetchData = useCallback(async (pageOverride) => {
    const requestId = ++fetchRequestIdRef.current;

    if (!user || !domain || !branchid) {
      if (requestId === fetchRequestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
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
          categoryids: selectedCategories.length > 0 ? selectedCategories : null,
          branchid: Number(branchid),
          like: searchQuery || null,
        }
      );

      // A newer request (or unmount) superseded this one.
      if (requestId !== fetchRequestIdRef.current) {
        return;
      }

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
        isExcluded: newExcluded.some((item) => item.productid === product.id && isAllChannelsExcluded(item.disabled_by)),
        isExcludedQr: newExcluded.some((item) => item.productid === product.id && item.disabled_by === "qr-menu"),
        isExcludedOnline: newExcluded.some((item) => item.productid === product.id && item.disabled_by === "online"),
      }));

      setProducts(updatedProducts);
      setTotalPages(total / perPage);

      if (__DEV__) {
        console.log(`[Products] Loaded ${updatedProducts.length} product(s) for branch ${branchid}`);
      }
    } catch (error) {
      if (requestId !== fetchRequestIdRef.current) {
        return;
      }
      console.error('Error fetching products:', error);
      setProducts([]);
      setExcluded([]);
      setApiError(error);
    } finally {
      if (requestId === fetchRequestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [user, domain, branchid, userLanguage, page, selectedCategories, searchQuery, clearError, setApiError]);

  useEffect(() => {
    return () => {
      // Invalidate in-flight fetches on unmount.
      fetchRequestIdRef.current += 1;
    };
  }, []);

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
  }, [isConnected, page, userLanguage, selectedCategories, branchid, searchQuery, fetchData, user, domain]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (!user || !domain || !branchid) return;
      setPage(1);
      setRefreshing(true);
      fetchData(1);
    });

    return unsubscribe;
  }, [navigation, fetchData, user, domain, branchid]);

  const wasFilterOpenRef = useRef(false);
  const selectedCategoriesRef = useRef(selectedCategories);
  selectedCategoriesRef.current = selectedCategories;

  useEffect(() => {
    // Capture previous open state before updating the ref so open→close
    // transitions remain deterministic across rapid toggles.
    const wasOpen = wasFilterOpenRef.current;
    wasFilterOpenRef.current = showFilter;

    // Only reset when the panel closes (not on initial mount while already closed)
    if (!wasOpen || showFilter) {
      return;
    }

    if (selectedCategoriesRef.current.length > 0) {
      setSelectedCategories([]);
      setCategoryPickerKey((key) => key + 1);
      setPage(1);
    }
  }, [showFilter]);

  useEffect(() => {
    if (!showSearch) {
      setSearchQuery("");
    }
  }, [showSearch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setCheckedItems([]);
  }, [fetchData]);

  const branchEnabledRef = useRef(branchEnabled);
  branchEnabledRef.current = branchEnabled;

  const handleSearchChange = useMemo(
    () =>
      throttle((query) => {
        if (!branchEnabledRef.current) return;
        setSearchQuery(query);
        setPage(1);
      }, 500),
    []
  );

  useEffect(() => {
    return () => {
      handleSearchChange.cancel();
    };
  }, [handleSearchChange]);

  // Drop any pending throttled search when branch context changes so a
  // previously scheduled call cannot apply against the new branch.
  useEffect(() => {
    handleSearchChange.cancel();
  }, [branchEnabled, handleSearchChange]);

  useEffect(() => {
    handleSearchChange.cancel();
    setSearchQuery("");
    setPage(1);
  }, [branchid, handleSearchChange]);

  const handleAddCategoryFilter = useCallback((categoryId) => {
    if (categoryId == null || !branchEnabled) return;
    if (selectedCategories.includes(categoryId)) return;

    setSelectedCategories((prev) => [...prev, categoryId]);
    setCategoryPickerKey((key) => key + 1);
    setPage(1);
  }, [branchEnabled, selectedCategories]);

  const handleRemoveCategoryFilter = useCallback((categoryId) => {
    if (!branchEnabled) return;
    setSelectedCategories((prev) => prev.filter((id) => id !== categoryId));
    setPage(1);
  }, [branchEnabled]);

  const handleClearCategoryFilters = useCallback(() => {
    if (!branchEnabled) return;
    setSelectedCategories([]);
    setCategoryPickerKey((key) => key + 1);
    setPage(1);
  }, [branchEnabled]);

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

              return !(ex.productid === item.id && isAllChannelsExcluded(ex.disabled_by));
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

            return prev.filter(ex => !(ex.productid === item.id && isAllChannelsExcluded(ex.disabled_by)));
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

  const isProductExcludedForChannel = useCallback((productId, disabledBy) => {
    return excluded.some((item) => {
      if (item.productid !== productId) return false;
      if (disabledBy === "") return isAllChannelsExcluded(item.disabled_by);
      return item.disabled_by === disabledBy;
    });
  }, [excluded]);

  const handleCheckboxPress = useCallback((id) => {
    if (!branchEnabled) return;

    setCheckedItems((prevState) => {
      if (prevState.includes(id)) {
        return prevState.filter((item) => item !== id);
      }
      return [...prevState, id];
    });
  }, [branchEnabled]);

  const openBulkActivityModal = useCallback(() => {
    if (!branchEnabled) return;

    if (checkedItems.length === 0) {
      Alert.alert(
        dictionary["general.alerts"] || "Alert",
        dictionary["prod.noProductsSelected"] || "Select products first"
      );
      return;
    }

    setBulkModalVisible(true);
  }, [branchEnabled, checkedItems.length, dictionary]);

  const applyBulkActivity = useCallback(async (channels, action = "toggle") => {
    if (!domain || !branchid || !branchEnabled || channels.length === 0) return;

    setBulkLoading(true);
    try {
      for (const disabledBy of channels) {
        let productIds = checkedItems;

        if (action === "disable") {
          productIds = checkedItems.filter(
            (productId) => !isProductExcludedForChannel(productId, disabledBy)
          );
        } else if (action === "enable") {
          productIds = checkedItems.filter((productId) =>
            isProductExcludedForChannel(productId, disabledBy)
          );
        }

        if (productIds.length === 0) continue;

        await axiosInstance.post(
          `https://${domain}/api/v1/admin/productActivity`,
          {
            pid: productIds,
            branchid: branchid,
            disabled_by: disabledBy,
          }
        );
      }

      setBulkModalVisible(false);
      setCheckedItems([]);
      await onRefresh();
    } catch (error) {
      console.error("Error updating bulk product activity:", error);
      // Keep selection on partial failure; refresh so UI matches what succeeded
      await onRefresh();
      Alert.alert(
        dictionary["general.alerts"] || "Alert",
        dictionary["errors.generic"] || "Something went wrong. Please try again."
      );
    } finally {
      setBulkLoading(false);
    }
  }, [
    domain,
    branchid,
    branchEnabled,
    checkedItems,
    isProductExcludedForChannel,
    onRefresh,
    dictionary,
  ]);

  const handleNavigate = useCallback((id) => {
    navigation.navigate('ProductsDetail', { id });
  }, [navigation]);

  const renderItem = useCallback(({ item }) => {
    const isExcluded = excluded.some((excludedItem) => excludedItem.productid === item.id && isAllChannelsExcluded(excludedItem.disabled_by));
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
    category
      .filter((item) => !selectedCategories.includes(item.id))
      .map((item) => ({ label: item.name, value: item.id }))
  , [category, selectedCategories]);

  const selectedCategoryChips = useMemo(() =>
    selectedCategories
      .map((id) => category.find((item) => item.id === id))
      .filter(Boolean)
  , [selectedCategories, category]);

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
            {selectedCategories.length > 0 ? ` (${selectedCategories.length})` : ""}
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
            onPress={openBulkActivityModal}
          >
            On/Off
          </Button>
        </View>
      </View>

      <ProductsBulkActivityModal
        visible={bulkModalVisible}
        selectedCount={checkedItems.length}
        loading={bulkLoading}
        onClose={() => !bulkLoading && setBulkModalVisible(false)}
        onApply={applyBulkActivity}
      />

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
          <View style={styles.filterPanel}>
            <SelectOption
              key={categoryPickerKey}
              value={null}
              placeholder={dictionary["prod.chooseCategory"] || "Choose Category"}
              onValueChange={handleAddCategoryFilter}
              items={categoryItems}
            />
            {selectedCategoryChips.length > 0 && (
              <View style={styles.chipRow}>
                {selectedCategoryChips.map((item) => (
                  <Chip
                    key={item.id}
                    style={styles.chip}
                    textStyle={styles.chipText}
                    onClose={() => handleRemoveCategoryFilter(item.id)}
                    closeIconAccessibilityLabel={dictionary["filter.clear"] || "Clear"}
                  >
                    {item.name}
                  </Chip>
                ))}
                <Button
                  compact
                  mode="text"
                  onPress={handleClearCategoryFilters}
                  labelStyle={styles.clearFiltersLabel}
                >
                  {dictionary["filter.clear"] || "Clear"}
                </Button>
              </View>
            )}
          </View>
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
  filterPanel: {
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: '#e8f1fb',
    marginBottom: 4,
  },
  chipText: {
    fontSize: 13,
  },
  clearFiltersLabel: {
    fontSize: 13,
    color: '#3490dc',
  },
});