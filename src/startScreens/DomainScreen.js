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
  const { domain, setDomain, readDomain, intervalId, checkDomain, isLoading, setIsLoading } = useContext(AuthContext);
  const [inputDomain, setInputDomain] = useState({ value: domain || '', error: '' });
  const [isChecking, setIsChecking] = useState(false);
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

    const trimmedDomain = inputDomain.value.trim();

    if (!trimmedDomain) {
      setError({ type: "VALIDATION_ERROR", message: dictionary?.['errors.DOMAIN_REQUIRED'] || "Domain is required" });
      return;
    }

    // domainValidator returns a string error or empty string
    const domainError = domainValidator(trimmedDomain);
    if (domainError && typeof domainError === 'string' && domainError.length > 0) {
      setError({ type: "VALIDATION_ERROR", message: domainError });
      return;
    }

    // Validate domain exists in the backend system
    setIsChecking(true);
    try {
      const result = await checkDomain(trimmedDomain);
      
      if (!result.success) {
        // Domain not found or validation failed
        setError({
          type: result.error?.type || "WEBSITE_NOT_FOUND",
          message: result.error?.message || dictionary?.['errors.WEBSITE_NOT_FOUND'] || "Website not found"
        });
        return;
      }

      // Domain is valid - save and navigate
      await storeData("domain", trimmedDomain);
      setDomain(trimmedDomain);
      await readDomain();
      navigation.navigate("Branch");
    } catch (err) {
      setError({
        type: "DOMAIN_CHECK_ERROR",
        message: err.message || dictionary?.['errors.DOMAIN_CHECK_ERROR'] || "Failed to verify domain"
      });
    } finally {
      setIsChecking(false);
    }
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
        disabled={!inputDomain.value.trim() || isChecking}
        loading={isChecking}
      >
        {isChecking ? (dictionary?.['checking'] || 'Checking...') : (dictionary?.['save'] || 'Save')}
      </Button>
    </Background>
  );
};