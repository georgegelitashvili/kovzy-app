import React, { useState, useEffect, useContext } from "react";
import { Text } from "react-native-paper";
import Background from "../components/generate/Background";
import Logo from "../components/generate/Logo";
import Button from "../components/generate/Button";
import SelectOption from "../components/generate/SelectOption";
import { storeData } from "../helpers/storage";
import Loader from "../components/generate/loader";
import { AuthContext } from "../context/AuthProvider";
import axiosInstance from "../apiConfig/apiRequests";

export const BranchScreen = ({ navigation }) => {
  const { isDataSet, setIsDataSet, domain, branchid, intervalId } = useContext(AuthContext);
  const [branches, setBranches] = useState([]);
  const [selected, setSelected] = useState(branchid);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  const branchApi = () => {
    const url = `https://${domain}/api/v1/admin/branches`;
    console.log(url);
    try {
      axiosInstance.post(url)
        .then((response) => {
          const data = response.data.data || [];
          setBranches(data.map((item) => ({
            label: item.title,
            value: item.id,
            enabled: item.enabled
          })));
          setErrorText("");
        })
        .catch((error) => {
          if (error.response && (error.response.status === 500 || error.response.status === 404)) {
            setIsDataSet(false);
            setBranches([]);
            setErrorText("Unable to fetch branch list. Please check your internet connection and try again.");
          }
        })
        .catch((error) => {
          setIsDataSet(false);
          setBranches([]);
          setErrorText("An error occurred while fetching branch list. Please try again later.");
        });
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
    clearInterval(intervalId);
  });

  useEffect(() => {
    if (domain) {
      setBranches([]);
      setSelected(null);
      setErrorText("");
      branchApi();
    }
  }, [domain]);

  useEffect(() => {
    branchApi();
  }, []);

  useEffect(() => {
    if (selected !== null) {
      const selectedBranch = branches.find((branch) => branch.value === selected);
      if (selectedBranch) {
        storeData("branchName", selectedBranch.label);
      }
      storeData("branch", selected);
      setIsDataSet((data) => !data);
    }
  }, [selected]);

  // console.log("branch screen data set: ", isDataSet);
  // console.log("branch screen branches: ", branches);
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
        style={{ backgroundColor: "#000" }}
        onPress={onCheckPressed}
      >
        accept
      </Button>
    </Background>
  );
};

