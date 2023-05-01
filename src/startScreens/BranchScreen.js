import React, { useState, useEffect, useContext } from "react";
import Background from "../components/generate/Background";
import Logo from "../components/generate/Logo";
import Button from "../components/generate/Button";
import SelectOption from "../components/generate/SelectOption";
import { storeData } from "../helpers/storage";
import Loader from "../components/generate/loader";
import { AuthContext, AuthProvider } from "../context/AuthProvider";

import axiosInstance from "../apiConfig/apiRequests";

export const BranchScreen = ({ navigation }) => {
  const { domain, branchid } = useContext(AuthContext);
  const [branches, setBranches] = useState([]);

  const [branch, setBranch] = useState({ data: branches || null, error: "" });
  const [selected, setSelected] = useState(branchid);

  const [isLoading, setIsLoading] = useState(true);

  const [options, setOptions] = useState({}); // api options
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false); // check api options is loaded

  const branchApi = () => {
    setOptions({
      url: `https://${domain}/api/branches`,
    });
    setOptionsIsLoaded(true);
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
      branchApi();
    }
  }, [domain]);

  useEffect(() => {
    if (optionsIsLoaded) {
      axiosInstance.post(options.url).then((e) => {
        // console.log('------------------ response');
        // console.log(e);
        // console.log('------------------ end response');
        e.data.data?.map((item) =>
          setBranches((prev) => [
            ...prev,
            { label: item.title, value: item.id, enabled: item.enabled },
          ])
        );
      }).catch((error) => {
        console.log(error.response);
      });
    }
  }, [optionsIsLoaded]);

  useEffect(() => {
    if (branches) {
      setBranch({ data: branches, error: "" });
      setIsLoading(false);
    }
  }, [branches]);

  useEffect(() => {
    if (selected) {
      storeData("branch", selected);
    }
  }, [selected]);

  if (isLoading) {
    return <Loader />;
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
        items={branch?.data || ""}
        key={(item) => item?.id || ""}
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
