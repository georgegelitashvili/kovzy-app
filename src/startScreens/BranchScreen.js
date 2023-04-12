import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import Background from '../components/generate/Background';
import Header from '../components/generate/Header';
import Logo from '../components/generate/Logo';
import Button from '../components/generate/Button';
import Paragraph from '../components/generate/Paragraph';
import SelectOption from '../components/generate/SelectOption';
import { storeData, getData } from '../helpers/storage';
import { getBranches, getDeliveron } from '../redux/Actions'

export const BranchScreen = ({ navigation }) => {
  const { branches } = useSelector((state) => state.branchesReducer);
  const [branch, setBranch] = useState({data: branches, error: ''});
  const [selected, setSelected] = useState(null);

  const [domain, setDomain] = useState(null);
  const [domainIsLoaded, setDomainIsLoaded] = useState(false);

  const [options, setOptions] = useState({}); // api options
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false); // check api options is loaded

  const readData = async () => {
    await getData("domain").then(data => {
      setDomain(data.value);
      setDomainIsLoaded(true);
    })
  }

  const branchApi = async () => {
    setOptions({
      method: "POST",
      url: `https://${domain}/api/branches`
    });
    setOptionsIsLoaded(true);
  };

  const readBranch = async () => {
    try {
      await getData("branch").then(value => value ? setSelected(value) : '')
    } catch (e) {
      console.log('Failed to fetch the input from storage');
    }
  };

  const onCheckPressed = () => {
    if (selected === null) {
      setBranch({ ...branch, error: 'Branch must choose!'});
      return;
    }
    navigation.navigate("Login");
  };

  const dispatch = useDispatch();
  const fetchBranches = () => {dispatch(getBranches(options))};

  useEffect(() => {
    readData();
  });

  useEffect(() => {
    if(domainIsLoaded) {
      branchApi();
      readBranch();
    }
  }, [domainIsLoaded])

  useEffect(() => {
    if(optionsIsLoaded) {
      fetchBranches();
    }
  }, [optionsIsLoaded]);

  useEffect(() => {
    if(branches) {
      setBranch({data: branches, error: ''})
    }
  }, [branches]);

  useEffect(() => {
    if(selected) {
      storeData("branch", selected);
    }
  }, [selected]);


  if(branches?.length == 0){
    return null;
  }

  return (
    <Background>
        <Logo />

      <SelectOption
        value={selected || null}
        onValueChange={(value) => {setSelected(value);setBranch({ ...branch, error: '' });}}
        items={branch?.data || ''}
        key={(item)=> item?.id || ''}
        error={!!branch?.error}
        errorText={branch?.error || ''}
      />

      <Button
        mode="contained"
        style={{backgroundColor: '#000'}}
        onPress={onCheckPressed}
      >
        accept
      </Button>
    </Background>
  )
}