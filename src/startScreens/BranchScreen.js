import React, { useState, useEffect, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import Background from '../components/generate/Background';
import Header from '../components/generate/Header';
import Logo from '../components/generate/Logo';
import Button from '../components/generate/Button';
import Paragraph from '../components/generate/Paragraph';
import SelectOption from '../components/generate/SelectOption';
import { storeData, getData } from '../helpers/storage';
import Loader from "../components/generate/loader";
import { AuthContext, AuthProvider } from '../context/AuthProvider';
import { getBranches } from '../redux/Actions'

export const BranchScreen = ({ navigation }) => {
  const { branches } = useSelector((state) => state.branchesReducer);
  const { domain, branchid } = useContext(AuthContext);

  const [branch, setBranch] = useState({data: branches, error: ''});
  const [selected, setSelected] = useState(branchid);

  // const [domain, setDomain] = useState(null);
  // const [domainIsLoaded, setDomainIsLoaded] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const [options, setOptions] = useState({}); // api options
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false); // check api options is loaded

  const readData = async () => {
    await getData("domain").then(data => {
      setDomain(data.value);
      setDomainIsLoaded(true);
    })
  }

  const branchApi = () => {
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

  console.log(domain);

  useEffect(() => {
    // readBranch();
    if(domain) {
      branchApi();
    }
  }, [domain])

  useEffect(() => {
    if(optionsIsLoaded) {
      fetchBranches();
    }
  }, [optionsIsLoaded]);

  useEffect(() => {
    if(branches) {
      setBranch({data: branches, error: ''});
      setIsLoading(false);
    }
  }, [branches]);

  useEffect(() => {
    if(selected) {
      storeData("branch", selected);
    }
  }, [selected]);


  if(isLoading) {
    return <Loader text="loading"/>
  }

  return (
    <Background>
        <Logo />

      <SelectOption
        value={selected}
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