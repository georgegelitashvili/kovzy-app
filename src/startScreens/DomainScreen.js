import React, { useState, useEffect, useContext } from 'react';
import Background from '../components/generate/Background';
import Logo from '../components/generate/Logo';
import { Text, Button } from "react-native-paper";
import TextField from '../components/generate/TextField';
import { AuthContext, AuthProvider } from '../context/AuthProvider';
import { domainValidator } from '../helpers/domainValidator';
import { storeData, getData } from '../helpers/storage';
import { LanguageContext } from "../components/Language";
import useErrorDisplay from "../hooks/useErrorDisplay";

export const DomainScreen = ({ navigation }) => {
  const { domain, setDomain, readDomain, intervalId } = useContext(AuthContext);
  const [inputDomain, setInputDomain] = useState({ value: domain || '', error: '' });
  const { dictionary } = useContext(LanguageContext);

  const { errorDisplay, error, setError, clearError } = useErrorDisplay();

  const readData = async () => {
    try {
      const value = await getData("domain");
      setDomain(value);
    } catch (e) {
      console.log('Failed to fetch the input from storage');
    }
  };

  const onCheckPressed = async () => {
    const domainError = domainValidator(inputDomain.value.trim());
    if (domainError) {
      console.log('Domain validation error:', domainError);
      setError({ type: "VALIDATION_ERROR", message: domainError });
      return;
    }
    
    setDomain(inputDomain.value.trim());
    await storeData("domain", inputDomain.value.trim());
    await readDomain();

    navigation.navigate("Branch");
  };

  useEffect(() => {
    setInputDomain({ value: domain || '', error: '' });
    clearInterval(intervalId);
  }, [domain]);

  useEffect(() => {
    readData();
    clearInterval(intervalId);
  }, []);

  return (
    <Background>
      {errorDisplay}
      <Logo />
      <TextField
        label="Enter domain"
        editable={true}
        clearButtonMode='always'
        value={inputDomain.value}
        onChangeText={(text) => { setInputDomain({ value: text.trim(), error: '' }); }}
        error={!!inputDomain.error}
        errorText={inputDomain.error}
        autoCapitalize="none"
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
  )
};
