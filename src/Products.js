import React, { useState, useEffect, useContext, useCallback } from "react";
import { StyleSheet, View, TouchableOpacity, Dimensions, RefreshControl } from "react-native";
import { Text, Button, Divider, Card } from "react-native-paper";
import { FlatGrid } from "react-native-super-grid";
import SelectOption from "./components/generate/SelectOption";
import { AuthContext, AuthProvider } from "./context/AuthProvider";
import Loader from "./components/generate/loader";
import { String, LanguageContext } from "./components/Language";
import axiosInstance from "./apiConfig/apiRequests";

const width = Dimensions.get("window").width;

export default function Products({ navigation }) {
  const { domain } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [productData, setProductData] = useState({});

  const [selected, setSelected] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [options, setOptions] = useState({}); // api options
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false); // api options
  const [activityOptions, setActivityOptions] = useState({});
  const [sendApi, setSendApi] = useState(false);
  const [sendEnabled, setSendEnabled] = useState(false);
  const [value, setValue] = useState("");
  const [enabled, setEnabled] = useState("");
  const [productEnabled, setProductEnabled] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { dictionary, userLanguage } = useContext(LanguageContext);


  const apiOptions = () => {
    setOptions({
      url_getProducts: `https://${domain}/api/getProducts`,
      url_productActivity: `https://${domain}/api/productActivity`,
    });

    setOptionsIsLoaded(true);
  };

  useEffect(() => {
    if (domain) {
      apiOptions();
    }
  }, [domain]);

  useEffect(() => {
    if (optionsIsLoaded && (page || userLanguage || selected)) {
      setProductData((prev) => ({ ...prev, data: { lang: userLanguage, page: page, categoryid: selected } }));
      setSendApi(true);
      setLoading(true);
    }
  }, [page, userLanguage, selected, optionsIsLoaded]);

  useEffect(() => {
    if (sendApi) {
      fetchData();
      setSendApi(false);
      setLoading(false);
    }
  }, [sendApi]);

  useEffect(() => {
    if (value) {
      setActivityOptions((prev) => ({
        ...prev,
        data: { pid: value, enabled: enabled },
      }));
      setSendEnabled(true);
    }
  }, [value, enabled]);

  useEffect(() => {
    if (sendEnabled) {
      axiosInstance.post(options.url_productActivity, activityOptions.data);
      setProductEnabled(true);
      setSendEnabled(false);
      setLoading(true);
    }
  }, [sendEnabled]);

  useEffect(() => {
    if (productEnabled) {
      fetchData();
      setProductEnabled(false);
      setSendApi(false);
      setLoading(false);
    }
  }, [productEnabled]);

  const fetchData = () => {
    axiosInstance
    .post(options.url_getProducts, productData.data)
    .then((resp) => {
      resp.data.category?.map((item) =>
      setCategory((prev) => [
        ...prev,
        { label: item.name, value: item.id },
      ])
    )
      setProducts(resp.data.data.data);
      setTotalPages(resp.data.data.total / resp.data.data.per_page);
    });
    setRefreshing(false);
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
    setSendApi(false);
  });

  const renderProductList = ({ item }) => {
    return (
      <Card key={item.index}>
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium" style={styles.title}>
            {item.name}
          </Text>
        </Card.Content>

        <Card.Actions>
          {item.enabled == 1 ? (
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
          items={category || ""}
          key={(item) => item?.id || ""}
        />
      </View>
      <FlatGrid
        itemDimension={width}
        data={products || []}
        maxItemsPerRow={4}
        renderItem={renderProductList}
        adjustGridToStyles={true}
        contentContainerStyle={{ justifyContent: "flex-start" }}
        keyExtractor={(item) => item.id}
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
    padding: 10,
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
