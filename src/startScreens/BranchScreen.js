import React, { useState, useEffect, useContext, useCallback } from "react";
import { StyleSheet } from "react-native";
import { Text, Button } from "react-native-paper";
import Background from "../components/generate/Background";
import Logo from "../components/generate/Logo";
import SelectOption from "../components/generate/SelectOption";
import Loader from "../components/generate/loader";
import { getData, storeData, removeData } from "../helpers/storage";
import { AuthContext } from "../context/AuthProvider";
import axiosInstance from "../apiConfig/apiRequests";
import { LanguageContext } from "../components/Language";
import useErrorDisplay from "../hooks/useErrorDisplay";

export const BranchScreen = ({ navigation }) => {
  const { domain, branchid, setBranchid, intervalId, readRestData, handleError } = useContext(AuthContext);
  const { dictionary, userLanguage } = useContext(LanguageContext);

  const [branches, setBranches] = useState([]);
  const [branch, setBranch] = useState([]);
  const [selected, setSelected] = useState(branchid);
  const [isLoading, setIsLoading] = useState(true);
  const [options, setOptions] = useState({ url_branches: "" });

  const { errorDisplay, error, setError, clearError } = useErrorDisplay();

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
      setError({ type: "MISSING_URL", message: "Branch URL is not defined" });
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
        enabled: item.temp_close,
      })));
    } catch (error) {
      const msg =
        error.response?.status === 500 || error.response?.status === 404
          ? "Unable to fetch branch list."
          : "An error occurred while fetching branch list. Please try again.";

      setError({ type: "FETCH_BRANCH_ERROR", message: msg });
      setBranch([]);
      setBranches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onCheckPressed = () => {
    if (selected === null) {
      setError({ type: "VALIDATION_ERROR", message: "Branch must be chosen!" });
      return;
    }
    navigation.navigate("Login");
  };

  useEffect(() => {
    apiOptions();
    setBranches([]);
    setBranch([]);
    setSelected(null);
    clearError();
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
        await removeData("branches");
        const item = branch.find(item => item.id === selected);
        if (item) {
          await storeData("branches", item);
          await readRestData();
        }
        setBranchid(selected);
        await storeData("branch", selected);
        clearInterval(intervalId);
      }
    };

    saveSelection();
  }, [domain, selected, userLanguage]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Background>
      <Logo />
      {errorDisplay}

      <SelectOption
        value={selected}
        onValueChange={(value) => {
          setSelected(value);
          clearError();
        }}
        items={branches}
        placeholder={dictionary["pt.chooseBranch"]}
        keyExtractor={(item) => (item && item.id ? item.id.toString() : '')}
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
