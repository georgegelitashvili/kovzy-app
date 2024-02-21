import React, { useState, useEffect, useContext } from "react";
import { Text } from "react-native-paper";
import Background from "../components/generate/Background";
import Logo from "../components/generate/Logo";
import Button from "../components/generate/Button";
import SelectOption from "../components/generate/SelectOption";
import { storeData } from "../helpers/storage";
import Toast from '../components/generate/Toast';
import Loader from "../components/generate/loader";
import { AuthContext, AuthProvider } from "../context/AuthProvider";

import axiosInstance from "../apiConfig/apiRequests";

export const BranchScreen = ({ navigation }) => {
  const { setIsDataSet, domain, branchid } = useContext(AuthContext);
  const [branches, setBranches] = useState([]);

  const [branch, setBranch] = useState({ data: branches || null, error: "" });
  const [selected, setSelected] = useState(branchid);
  const [isLoading, setIsLoading] = useState(true);

  const [options, setOptions] = useState({}); // api options

  const [errorText, setErrorText] = useState("");

  const branchApi = () => {
    setOptions({
      url: `https://${domain}/api/v1/admin/branches`,
    });
  };

  const onCheckPressed = () => {
    if (selected === null) {
      setBranch({ ...branch, error: "Branch must choose!" });
      return;
    }

    navigation.navigate("Login");
  };

  useEffect(() => {
    if (domain) {
      setBranches([]);
      setBranch({ data: null, error: "" });
      setSelected(null);
      setErrorText("");
      branchApi();
    }
  }, [domain]);

  useEffect(() => {
    if (options) {
      axiosInstance.post(options.url)
        .then((e) => e.data.data)
        .then((data) => {
          setBranch({ data: null, error: "" });
          setBranches([]);
          setErrorText("");
          setIsDataSet(false);
          data?.map((item) =>
            setBranches((prev) => [
              ...prev,
              { label: item.title, value: item.id, enabled: item.enabled },
            ])
          );
          setIsLoading(false);
        })
        .catch((error) => {
        console.log('error branch', error.status);
          if (error.status == 500 || error.status == 404) {
          setIsDataSet(false);
          setBranches([]);
          setBranch({ data: null, error: "" });
          setIsLoading(true);
          setErrorText("Branch list not found or Domain is incorrect");
        }
      });
    }
  }, [options]);

  useEffect(() => {
    if (branches) {
      setBranch({ data: branches, error: "" });
    }
  }, [branches]);

  useEffect(() => {
    if (selected) {
      branches?.map((e) => {
        if (e.value === selected) {
          storeData("branchName", e.label);
        }
      })
      storeData("branch", selected);
      setIsDataSet((data) => !data);
    }
  }, [selected]);

  // console.log("===================  branches list");
  // console.log(branch.data);
  // console.log("=================== end branches list");

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
          setBranch({ ...branch, error: "" });
        }}
        items={branch?.data || []}
        key={(item) => item?.id || 1}
        error={!!branch?.error}
        errorText={branch?.error || ""}
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
