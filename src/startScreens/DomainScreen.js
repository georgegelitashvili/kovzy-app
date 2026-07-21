import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
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
  const { domain, setDomain, readDomain, intervalId, checkDomain, isLoading, setIsLoading, clearErrors } = useContext(AuthContext);
  const [inputDomain, setInputDomain] = useState({ value: domain || '', error: '' });
  const [isChecking, setIsChecking] = useState(false);
  const { dictionary } = useContext(LanguageContext);
  const { setError, clearError, errorDisplay } = useErrorDisplay({ showInline: true });

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
    clearErrors();

    const trimmedDomain = inputDomain.value.trim();

    if (!trimmedDomain) {
      setError({ type: "VALIDATION_ERROR", message: dictionary?.['errors.DOMAIN_REQUIRED'] || "Domain is required" });
      return;
    }

    // domainValidator returns a string error or empty string
    // const domainError = domainValidator(trimmedDomain);
    // if (domainError && typeof domainError === 'string' && domainError.length > 0) {
    //   setError({ type: "VALIDATION_ERROR", message: domainError });
    //   return;
    // }

    // Validate domain exists in the backend system
    setIsChecking(true);
    try {
      // const result = await checkDomain(trimmedDomain);
      
      // if (!result.success) {
      //   const errorPayload = {
      //     type: result.error?.type || "WEBSITE_NOT_FOUND",
      //   };
      //   if (result.error?.message) {
      //     errorPayload.message = result.error.message;
      //   }
      //   setError(errorPayload);
      //   return;
      // }

      // Domain is valid - save and navigate
      await storeData("domain", trimmedDomain);
      setDomain(trimmedDomain);
      await readDomain();
      navigation.navigate("Branch");
    } catch (err) {
      setError({
        type: "DOMAIN_CHECK_ERROR",
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
    <View style={styles.screen}>
      {errorDisplay ? (
        <View style={styles.errorOverlay} pointerEvents="box-none">
          {errorDisplay}
        </View>
      ) : null}
      <Background>
        <Logo />
      <TextField
        dense
        label="Enter domain"
        editable={true}
        clearButtonMode='always'
        value={inputDomain.value}
        onChangeText={(text) => {
          clearError();
          clearErrors();
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
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10000,
    elevation: 10000,
  },
});