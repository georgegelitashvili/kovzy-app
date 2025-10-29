import React, { useState, useEffect, useContext } from 'react';
import Background from '../components/generate/Background';
import Logo from '../components/generate/Logo';
import { Button } from "react-native-paper";
import TextField from '../components/generate/TextField';
import { AuthContext, AuthProvider } from '../context/AuthProvider';
import { domainValidator } from '../helpers/domainValidator';
import { storeData, getData, removeData } from '../helpers/storage';
import { LanguageContext } from "../components/Language";
import useErrorDisplay from "../hooks/useErrorDisplay";

export const DomainScreen = ({ navigation }) => {
  // All hooks must be called unconditionally and before any return
  const { domain, setDomain, readDomain, intervalId } = useContext(AuthContext);
  const [inputDomain, setInputDomain] = useState({ value: domain || '', error: '' });
  const { dictionary } = useContext(LanguageContext);
  const { errorDisplay, error, setError, clearError } = useErrorDisplay();

  // Helper to read domain from storage
  const readData = async () => {
    // await removeData("domain");
    try {
      const value = await getData("domain");
      setDomain(value);
    } catch (e) {
      console.log('Failed to fetch the input from storage');
    }
  };

  // Handler for domain check
  const onCheckPressed = async () => {
    clearError();

    if (!inputDomain.value.trim()) {
      setError({ type: "VALIDATION_ERROR", message: "Domain is required" });
      return;
    }

    // domainValidator returns a string error or empty string
    const domainError = domainValidator(inputDomain.value.trim());
    if (domainError && typeof domainError === 'string' && domainError.length > 0) {
      setError({ type: "VALIDATION_ERROR", message: domainError });
      return;
    }

    // Only save and set valid domain
    await storeData("domain", inputDomain.value.trim());
    setDomain(inputDomain.value.trim());
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

  // No early return before hooks, all hooks above
  return (
    <Background>
      {errorDisplay}
      <Logo />
      <TextField
        dense
        label="Enter domain"
        editable={true}
        clearButtonMode='always'
        value={inputDomain.value}
        onChangeText={(text) => {
          clearError();
          setInputDomain({ value: text, error: '' });
        }}
        error={!!inputDomain.error}
        errorText={inputDomain.error}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={onCheckPressed}
        mode="outlined"
      />
      <Button
        mode="contained"
        textColor="white"
        buttonColor="#000"
        onPress={onCheckPressed}
        disabled={!inputDomain.value.trim()}
      >
        {dictionary['save']}
      </Button>
    </Background>
  );
};