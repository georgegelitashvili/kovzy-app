import React, { useState, useEffect, useContext } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Text, Button, Divider, Card } from "react-native-paper";
import { FlatGrid } from "react-native-super-grid";
import { AuthContext, AuthProvider } from './context/AuthProvider';
import { getData } from "./helpers/storage";
import Loader from "./components/generate/loader";
import { String, LanguageContext } from "./components/Language";
import { Request } from "./axios/apiRequests";

const width = Dimensions.get("window").width;

export default function Products({ navigation }) {
  const [products, setProducts] = useState([]);

  const { domain } = useContext(AuthContext);

  // const [domain, setDomain] = useState(null);
  const [domainIsLoaded, setDomainIsLoaded] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [options, setOptions] = useState({}); // api options
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false); // api options
  const [activityOptions, setActivityOptions] = useState({});
  const [activityOptionsIsLoaded, setActivityOptionsIsLoaded] = useState(false); // api options
  const [sendApi, setSendApi] = useState(false);
  const [sendEnabled, setSendEnabled] = useState(false);
  const [value, setValue] = useState("");
  const [enabled, setEnabled] = useState("");
  const [productEnabled, setProductEnabled] = useState(false);
  const [lang, setLang] = useState("");

  const [loading, setLoading] = useState(true);

  const { dictionary } = useContext(LanguageContext);

  getData("rcml-lang").then((lang) => setLang(lang || "ka"));

  const readDomain = () => {
    setOptions({
      method: "POST",
      url: `https://${domain}/api/getProducts`,
    });
    setOptionsIsLoaded(true);
  };

  const productActivity = () => {
    setActivityOptions({
      method: "POST",
      url: `https://${domain}/api/productActivity`,
    });
    setActivityOptionsIsLoaded(true);
  };

  useEffect(() => {
    if(domain) {
      readDomain();
      productActivity();
    }
  }, [domain])

  useEffect(() => {
    if (optionsIsLoaded && (page || lang)) {
      setOptions((prev) => ({ ...prev, data: { lang: lang, page: page } }));
      setSendApi(true);
      setLoading(true);
    }
  }, [page, lang, optionsIsLoaded]);

  useEffect(() => {
    if (sendApi) {
      Request(options).then((resp) => {
        setProducts(resp);
        setTotalPages(resp.total / resp.per_page);
      });
      setSendApi(false);
      setLoading(false);
    }
  }, [sendApi]);


  useEffect(() => {
    if(activityOptionsIsLoaded && value) {
      setActivityOptions((prev) => ({...prev, data: {pid: value, enabled: enabled}}));
      setSendEnabled(true);
    }
  }, [activityOptionsIsLoaded, value, enabled])

  useEffect(() => {
    if(sendEnabled) {
      Request(activityOptions)
      setProductEnabled(true);
      setSendEnabled(false);
    }
  }, [sendEnabled])


  useEffect(() => {
    if (productEnabled) {
      Request(options).then((resp) => {
        setProducts(resp);
        setTotalPages(resp.total / resp.per_page);
      });
      setProductEnabled(false);
      setSendApi(false);
    }
  }, [productEnabled]);


  const renderProductList = (items) => {
    return (
      <Card key={items.index}>
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium" style={styles.title}>
            {items.item.name}
          </Text>
        </Card.Content>

          <Card.Actions>
                {items.item.enabled == 1 ? (
                  <Button textColor="white" buttonColor="#f14c4c" style={styles.button} onPress={() => {setValue(items.item.id);setEnabled(0)}}>{dictionary['prod.disableProduct']}</Button>
                ) : (
                  <Button textColor="white" buttonColor="#2fa360" style={styles.button} onPress={() => {setValue(items.item.id);setEnabled(1)}}>{dictionary['prod.enableProduct']}</Button>
                )}
            </Card.Actions>
      </Card>
    );
  };

  if(loading) {
    return (<Loader />)
  }

  return (
    <>
      <FlatGrid
        itemDimension={width}
        data={products.data || []}
        renderItem={renderProductList}
        adjustGridToStyles={true}
        contentContainerStyle={{ justifyContent: "flex-start" }}
        keyExtractor={(item) => item.id}
        onEndReachedThreshold={0.5}
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
    padding: 10
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
