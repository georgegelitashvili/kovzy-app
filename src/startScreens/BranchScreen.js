import React, { useState, useEffect, useContext, useCallback } from "react";
import { StyleSheet } from "react-native";
import { Text, Button } from "react-native-paper";
import Background from "../components/generate/Background";
import Logo from "../components/generate/Logo";
import SelectOption from "../components/generate/SelectOption";
import Loader from "../components/generate/loader";
import { getData, storeData, removeData } from "../helpers/storage";
import { domainValidator } from "../helpers/domainValidator";
import { AuthContext } from "../context/AuthProvider";
import axiosInstance from "../apiConfig/apiRequests";
import { LanguageContext } from "../components/Language";
import useErrorDisplay from "../hooks/useErrorDisplay";

export const BranchScreen = ({ navigation }) => {
  const { domain, branchid, setBranchid, intervalId, readRestData, handleError } = useContext(AuthContext);
  const { dictionary, userLanguage } = useContext(LanguageContext);

  // Always call all hooks at the top level - NEVER conditionally
  const [branches, setBranches] = useState([]);
  const [branch, setBranch] = useState([]);
  const [selected, setSelected] = useState(branchid);
  const [isLoading, setIsLoading] = useState(true);
  const [options, setOptions] = useState({ url_branches: "" });
  const [shouldRedirectToDomain, setShouldRedirectToDomain] = useState(false);
  const [currentDomain, setCurrentDomain] = useState(domain); // Track current domain for change detection

  const { errorDisplay, error, setError, clearError } = useErrorDisplay();

  // Check if domain is invalid (but don't return early)
  const isDomainInvalid = !domain || domainValidator(domain) !== '';

  // Handle domain redirection in useEffect instead of early return
  useEffect(() => {
    if (shouldRedirectToDomain) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Domain' }],
      });
    }
  }, [shouldRedirectToDomain, navigation]);

  // Validate domain before using it for API calls
  const apiOptions = useCallback(() => {
    console.log('[BranchScreen] Setting API options for domain:', domain);
    if (domain && domainValidator(domain) === '') {
      const newUrl = `https://${domain}/api/v1/admin/branches`;
      console.log('[BranchScreen] Valid domain, setting URL to:', newUrl);
      setOptions(prevOptions => ({
        ...prevOptions,
        url_branches: newUrl,
      }));
    } else {
      console.log('[BranchScreen] Invalid or missing domain, clearing URL');
      setOptions(prevOptions => ({ ...prevOptions, url_branches: "" }));
    }
  }, [domain]);

  const branchApi = useCallback(async () => {
    try {
      // Double-check domain validity before making API call
      if (!domain || domainValidator(domain) !== '') {
        console.log('[BranchScreen] Invalid domain detected in branchApi:', domain);
        setError({ 
          type: "INVALID_DOMAIN", 
          message: dictionary["errors.INVALID_DOMAIN"] || "Invalid domain entered. Please try again." 
        });
        setIsLoading(false);
        setBranch([]);
        setBranches([]);
        // Clear domain from storage and trigger redirect
        await removeData("domain").catch(() => console.log('Failed to clear domain'));
        setShouldRedirectToDomain(true);
        return;
      }
      
      if (!options.url_branches) {
        console.log('[BranchScreen] No API URL configured yet, waiting...');
        setIsLoading(false);
        return; // Don't show error, just wait for URL to be set
      }

      setIsLoading(true);
      clearError();
      console.log('[BranchScreen] Making API call to:', options.url_branches);
      
      const response = await axiosInstance.post(options.url_branches);
      const data = response.data?.branches || [];

      console.log('[BranchScreen] API call successful, received branches:', data.length);
      setBranch(data);
      setBranches(data.map((item) => ({
        label: item.titles?.[userLanguage] || item.name || 'Branch',
        value: item.id,
        enabled: item.temp_close,
      })));
      
      // Reset redirect flag if we successfully got data
      setShouldRedirectToDomain(false);
    } catch (apiError) {
      console.error('[BranchScreen] API error:', apiError);
      
      // Enhanced error detection for invalid domains
      const errorMessage = apiError?.message?.toLowerCase() || '';
      const errorCode = apiError?.code;
      const errorType = apiError?.type;
      const statusCode = apiError?.response?.status;
      
      let isDomainError = false;
      if (
        errorCode === 'ERR_NETWORK' ||
        errorType === 'INVALID_DOMAIN' ||
        errorMessage.includes('network') ||
        errorMessage.includes('dns') ||
        errorMessage.includes('not found') ||
        errorMessage.includes('enotfound') ||
        statusCode === 502 ||
        statusCode === 503
      ) {
        isDomainError = true;
      }
      
      if (isDomainError) {
        console.log('[BranchScreen] Domain error detected, clearing and redirecting');
        setError({ 
          type: "INVALID_DOMAIN", 
          message: dictionary["errors.INVALID_DOMAIN"] || "Invalid domain entered. Please try again." 
        });
        try {
          await removeData("domain");
          setShouldRedirectToDomain(true);
        } catch (storageError) {
          console.error('Failed to clear domain:', storageError);
          setShouldRedirectToDomain(true);
        }
      } else {
        const msg = statusCode === 500 || statusCode === 404
          ? dictionary["errors.FETCH_BRANCH_ERROR"] || "Unable to fetch branch list."
          : dictionary["errors.GENERAL"] || "An error occurred. Please try again.";
        setError({ type: "FETCH_BRANCH_ERROR", message: msg });
      }
      
      setBranch([]);
      setBranches([]);
    } finally {
      setIsLoading(false);
    }
  }, [domain, options.url_branches, dictionary, userLanguage]);

  const onCheckPressed = () => {
    if (selected === null) {
      setError({ type: "VALIDATION_ERROR", message: "Branch must be chosen!" });
      return;
    }
    navigation.navigate("Login");
  };

  // Main effect for domain changes - clear state and set up API options
  useEffect(() => {
    console.log('[BranchScreen] Domain changed from', currentDomain, 'to', domain);
    
    // Always clear previous state when domain changes (including from undefined to a value)
    if (currentDomain !== domain) {
      console.log('[BranchScreen] Domain change detected, clearing all state');
      setBranches([]);
      setBranch([]);
      setSelected(null);
      clearError();
      clearInterval(intervalId);
      setShouldRedirectToDomain(false);
      setCurrentDomain(domain);
      
      // Clear any cached branch data from storage when domain changes
      if (currentDomain && currentDomain !== domain) {
        console.log('[BranchScreen] Clearing cached branch data due to domain change');
        removeData(["branches", "branch"]).catch(() => {
          console.log('[BranchScreen] Failed to clear cached branch data');
        });
      }
    }
    
    // Handle domain validation and API setup
    if (!domain) {
      console.log('[BranchScreen] No domain provided');
      setIsLoading(false);
      setOptions({ url_branches: "" });
      return;
    }
    
    if (domainValidator(domain) !== '') {
      console.log('[BranchScreen] Invalid domain format:', domain);
      // Invalid domain - clear it and redirect
      setError({ 
        type: "INVALID_DOMAIN", 
        message: dictionary["errors.INVALID_DOMAIN"] || "Invalid domain. Please check and try again." 
      });
      setIsLoading(false);
      setOptions({ url_branches: "" });
      removeData("domain").then(() => {
        setShouldRedirectToDomain(true);
      }).catch(() => {
        setShouldRedirectToDomain(true);
      });
      return;
    }
    
    // Valid domain - set up API options
    console.log('[BranchScreen] Valid domain, setting up API');
    setIsLoading(true); // Start loading when valid domain is detected
    apiOptions();
  }, [domain, userLanguage, dictionary, intervalId, clearError, apiOptions, currentDomain]);

  // Separate effect for API calls when URL is ready
  useEffect(() => {
    if (domain && domainValidator(domain) === '' && options.url_branches) {
      console.log('[BranchScreen] API URL ready, triggering branch fetch:', options.url_branches);
      branchApi();
    }
  }, [domain, options.url_branches, branchApi]);

  // Cleanup effect when component unmounts or domain changes
  useEffect(() => {
    return () => {
      console.log('[BranchScreen] Cleanup: clearing intervals and cached data');
      clearInterval(intervalId);
      // Clear any cached branch data when component unmounts
      setBranches([]);
      setBranch([]);
    };
  }, [intervalId]);

  useEffect(() => {
    const saveSelection = async () => {
      if (selected !== null) {
        await removeData("branches");
        const item = branch.find(item => item.id === selected);
        if (item) {
          await storeData("branches", item);
          await readRestData();
        }
        setBranchid(selected);
        await storeData("branch", selected);
        clearInterval(intervalId);
      }
    };

    saveSelection();
  }, [domain, selected, userLanguage]);

  // Don't render anything if we're redirecting due to invalid domain
  if (shouldRedirectToDomain) {
    return null;
  }

  return (
    <Background>
      <Logo />
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {errorDisplay}

          <SelectOption
            value={selected}
            onValueChange={(value) => {
              setSelected(value);
              clearError();
            }}
            items={branches}
            placeholder={dictionary["pt.chooseBranch"]}
            keyExtractor={(item) => (item && item.id ? item.id.toString() : '')}
          />

          <Button
            mode="contained"
            textColor="white"
            buttonColor="#000"
            style={styles.button}
            onPress={onCheckPressed}
          >
            {dictionary['save']}
          </Button>
        </>
      )}
    </Background>
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: 17,
  },
});
