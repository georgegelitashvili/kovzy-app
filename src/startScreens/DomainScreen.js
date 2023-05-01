import React, { useState, useEffect, useContext } from 'react';
import Background from '../components/generate/Background';
import Logo from '../components/generate/Logo';
import Button from '../components/generate/Button';
import TextField from '../components/generate/TextField';
import { AuthContext, AuthProvider } from '../context/AuthProvider';
import { domainValidator } from '../helpers/domainValidator';
import { storeData, getData } from '../helpers/storage';



export const DomainScreen = ({ navigation }) => {
  const { setIsDataSet } = useContext(AuthContext);
  const [domain, setDomain] = useState({ value: "", error: "" });

  const readData = async () => {
    try {
      await getData("domain").then(value => {setDomain({ value: value, error: "" })})
    } catch (e) {
      console.log('Failed to fetch the input from storage');
    }
  };

  const onCheckPressed = () => {
    const domainError = domainValidator(domain.value)
    if (domainError) {
      setDomain({ ...domain, error: domainError })
      return
    }
    storeData("domain", domain.value);
    setIsDataSet((data) => !data);

    navigation.navigate("Branch");
  };

  useEffect(() => {
    readData();
  }, []);

  return (
    <Background>
        <Logo />

      <TextField
        label="enter domain"
        editable={true}
        clearButtonMode='always'
        value={domain?.value || ''}
        onChangeText={(text) => setDomain({ value: text, error: '' })}
        error={!!domain?.error}
        errorText={domain?.error || ''}
        autoCapitalize="none"
      />
      <Button
        mode="contained"
        style={{backgroundColor: '#000'}}
        onPress={onCheckPressed}
      >
        Check
      </Button>
    </Background>
  )
}