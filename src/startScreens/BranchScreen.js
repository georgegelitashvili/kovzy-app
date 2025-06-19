import React, { useState, useEffect, useContext, useCallback } from "react";
import { StyleSheet } from "react-native";
import { Text, Button } from "react-native-paper";
import Background from "../components/generate/Background";
import Logo from "../components/generate/Logo";
import SelectOption from "../components/generate/SelectOption";
import Toast from '../components/generate/Toast';
import { getData, storeData, removeData } from "../helpers/storage";
import Loader from "../components/generate/loader";
import { AuthContext } from "../context/AuthProvider";
import axiosInstance from "../apiConfig/apiRequests";
import { LanguageContext } from "../components/Language";

export const BranchScreen = ({ navigation }) => {
  const { setIsDataSet, domain, branchid, setBranchid, intervalId, readRestData, error, setError, clearErrors } = useContext(AuthContext);
  const [branches, setBranches] = useState([]);
  const [branch, setBranch] = useState([]);
  const [selected, setSelected] = useState(branchid);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const { dictionary, userLanguage } = useContext(LanguageContext);
  const [options, setOptions] = useState({
    url_branches: "",
  }); // api options

  const apiOptions = useCallback(() => {
    if (domain) {
      setOptions(prevOptions => ({
        ...prevOptions,
        url_branches: `https://${domain}/api/v1/admin/branches`,
      }));
    }
  }, [domain]);

  const branchApi = async () => {
    if (!options.url_branches) {
      console.error("URL is empty");
      return;
    }
    try {
      setIsLoading(true);
      const response = await axiosInstance.post(options.url_branches);
      const data = response.data.branches || [];

      setBranch(data);
      setBranches(data.map((item) => ({
        label: item.titles[userLanguage],
        value: item.id,
        enabled: item.temp_close
      })));
      setErrorText("");
    } catch (error) {
      if (error.response && (error.response.status === 500 || error.response.status === 404)) {
        setIsDataSet(false);
        setBranches([]);
        setBranch([]);
        setErrorText("Unable to fetch branch list.");
      } else {
        setIsDataSet(false);
        setBranches([]);
        setBranch([]);
        setErrorText("An error occurred while fetching branch list. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onCheckPressed = () => {
    if (selected === null) {
      setErrorText("Branch must be chosen!");
      return;
    }
    navigation.navigate("Login");
  };

  useEffect(() => {
      apiOptions();
      setBranches([]);
      setBranch([]);
      setSelected(null);
      setErrorText("");
      branchApi();
      clearInterval(intervalId);
  }, [domain, userLanguage]);

  useEffect(() => {
    branchApi();
    clearInterval(intervalId);
  }, [options, userLanguage]);

  useEffect(() => {
    const saveSelection = async () => {
      if (selected !== null) {
        await removeData("branchNames");

        console.log("Selected branch ID:", selected);
        console.log("Branch data:", branch);
        const item = branch.find(item => item.id === selected);
        if (item) {
          console.log("Branch item:", item);
          await storeData("branchNames", item);
          await readRestData();
        }

        await storeData("branch", selected);
        setIsDataSet(data => !data);
        setBranchid(selected);
        clearInterval(intervalId);
      }
    };

    saveSelection();
  }, [domain, selected, userLanguage]);

  if (isLoading) {
    return <Loader error={errorText} />;
  }

  return (
    <Background>
      <Logo />

      <SelectOption
        value={selected}
        onValueChange={(value) => {
          setSelected(value);
          setErrorText("");
        }}
        items={branches}
        placeholder={dictionary["pt.chooseBranch"]}
        keyExtractor={(item) => (item && item.id ? item.id.toString() : '')}
        error={!!errorText}
        errorText={errorText}
      />
      <Button
        mode="contained"
        textColor="white"
        buttonColor="#000"
        style={styles.button}
        onPress={onCheckPressed}
      >
        {dictionary['save']}
      </Button>
    </Background>
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: 17,
  },
});