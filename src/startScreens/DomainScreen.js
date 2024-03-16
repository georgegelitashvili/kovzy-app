import React, { useState, useEffect, useContext } from 'react';
import Background from '../components/generate/Background';
import Logo from '../components/generate/Logo';
import Button from '../components/generate/Button';
import TextField from '../components/generate/TextField';
import { AuthContext, AuthProvider } from '../context/AuthProvider';
import { domainValidator } from '../helpers/domainValidator';
import { storeData, getData } from '../helpers/storage';

export const DomainScreen = ({ navigation }) => {
  const { setIsDataSet, domain, setDomain, intervalId } = useContext(AuthContext);
  const [inputDomain, setInputDomain] = useState({ value: domain || '', error: '' });

  const readData = async () => {
    try {
      const value = await getData("domain");
      setDomain(value);
    } catch (e) {
      console.log('Failed to fetch the input from storage');
    }
  };

  const onCheckPressed = async () => {
    const domainError = domainValidator(inputDomain.value);
    if (domainError) {
      setInputDomain({ ...inputDomain, error: domainError });
      return;
    }
    setDomain(inputDomain.value);
    storeData("domain", inputDomain.value);
    setIsDataSet(true);

    navigation.navigate("Branch");
  };

  useEffect(() => {
    clearInterval(intervalId);
  });

  useEffect(() => {
    setInputDomain({ value: domain || '', error: '' });
  }, [domain]);

  useEffect(() => {
    readData();
    clearInterval(intervalId);
  }, []);

  return (
    <Background>
      <Logo />
      <TextField
        label="Enter domain"
        editable={true}
        clearButtonMode='always'
        value={inputDomain.value}
        onChangeText={(text) => { setInputDomain({ value: text, error: '' }); }}
        error={!!inputDomain.error}
        errorText={inputDomain.error}
        autoCapitalize="none"
      />
      <Button
        mode="contained"
        style={{ backgroundColor: '#000' }}
        onPress={onCheckPressed}
      >
        Save
      </Button>
    </Background>
  )
};
