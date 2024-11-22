import React, { useState, useEffect, useContext, useCallback } from "react";
import { Text, Button } from "react-native-paper";
import Background from "../components/generate/Background";
import Logo from "../components/generate/Logo";
import SelectOption from "../components/generate/SelectOption";
import { storeData } from "../helpers/storage";
import Loader from "../components/generate/loader";
import { AuthContext } from "../context/AuthProvider";
import axiosInstance from "../apiConfig/apiRequests";
import { LanguageContext } from "../components/Language";

export const BranchScreen = ({ navigation }) => {
  const { setIsDataSet, domain, branchid, setBranchid, intervalId } = useContext(AuthContext);
  const [branches, setBranches] = useState([]);
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
      const response = await axiosInstance.post(options.url_branches, {
        lang: userLanguage,
      });
      console.log(response.data.branches);
      const data = response.data.branches || [];

      setBranches(data.map((item) => ({
        label: item.title,
        value: item.id,
        enabled: item.temp_close
      })));
      setErrorText("");
    } catch (error) {
      if (error.response && (error.response.status === 500 || error.response.status === 404)) {
        setIsDataSet(false);
        setBranches([]);
        setErrorText("Unable to fetch branch list.");
      } else {
        setIsDataSet(false);
        setBranches([]);
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
      setSelected(null);
      setErrorText("");
      branchApi();
      clearInterval(intervalId);
  }, [domain]);

  useEffect(() => {
    branchApi();
    clearInterval(intervalId);
  }, [options]);

  useEffect(() => {
    if (selected !== null) {
      const selectedBranch = branches.find((branch) => branch.value === selected);
      if (selectedBranch) {
        storeData("branchName", selectedBranch.label);
      }
      storeData("branch", selected);
      setIsDataSet((data) => !data);
      setBranchid(selected);
      clearInterval(intervalId);
    }
  }, [selected]);

  console.log(branches);

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
        keyExtractor={(item) => (item && item.id ? item.id.toString() : '')}
        error={!!errorText}
        errorText={errorText}
      />
      <Button
        mode="contained"
        textColor="white"
        buttonColor="#000"
        onPress={onCheckPressed}
      >
        {dictionary['save']}
      </Button>
    </Background>
  );
};

