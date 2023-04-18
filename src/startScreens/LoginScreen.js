import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { TouchableOpacity, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import Background from '../components/generate/Background'
import Header from '../components/generate/Header'
import Button from '../components/generate/Button'
import TextField from '../components/generate/TextField'
import { theme } from '../core/theme'
import { nameValidator } from '../helpers/nameValidator'
import { passwordValidator } from '../helpers/passwordValidator'
import { storeData, getData } from "../helpers/storage";
import { login } from '../redux/Actions'

// 'alexander.tsintsadze'
// '700309

export const LoginScreen = ({ navigation }) => {
  const { isLoggingIn } = useSelector((state) => state.authReducer);
  const { loginError } = useSelector((state) => state.authReducer);
  const [name, setName] = useState({ value: '', error: '' });
  const [password, setPassword] = useState({ value: '', error: '' });

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


  const loginOptions = async () => {
    setOptions({
      method: "POST",
      url: `https://${domain}/api/auth/login`,
    });
    setOptionsIsLoaded(true);
  };

  const dispatch = useDispatch();
  const fetchLogin = () => dispatch(login(options));

  // login function
  const onLoginPressed = () => {
    const nameError = nameValidator(name.value);
    const passwordError = passwordValidator(password.value);

    if (nameError || passwordError) {
      setName({ ...name, error: nameError })
      setPassword({ ...password, error: passwordError })
      return;
    }

    if(optionsIsLoaded) {
      fetchLogin();
    }
  }

  useEffect(() => {
    readData();
  });

  // get options value
  useEffect(() => {
    if(domainIsLoaded) {
      loginOptions();
    }
  }, [domainIsLoaded]);

  // if name or password changed
  useEffect(() => {
    if(options) {
      setOptions({...options, data: {username: name.value, password: password.value}});
    }
  }, [name, password]);

  useEffect(() => {
    if (loginError?.length != 0) {
      setName({ ...name, error: typeof loginError === 'object' && loginError !== null ? loginError.username[0] : '' })
      setPassword({ ...password, error: typeof loginError === 'object' && loginError !== null ? '' : loginError })
    }
  }, [loginError])

  // if admin is authorized redirects to orders
  useEffect(() => {
    if(isLoggingIn) {
      navigation.navigate("Orders", { screen: "Order" });
    }
  }, [isLoggingIn])

  return (
    <Background>
      <Header style={{color: '#000'}}>Welcome to the kovzy app</Header>
      <TextField
        label="User name"
        returnKeyType="next"
        value={name?.value || ""}
        onChangeText={(text) => setName({ value: text, error: '' })}
        error={!!name.error}
        errorText={name.error}
        autoCapitalize="none"
        autoCompleteType="name"
        textContentType="username"
        typeOfKeyboard="text"
      />
      <TextField
        label="Password"
        returnKeyType="done"
        value={password?.value || ""}
        onChangeText={(text) => setPassword({ value: text, error: '' })}
        error={!!password.error}
        errorText={password.error}
        secureTextEntry={true}
      />
      <View style={styles.forgotPassword}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ResetPasswordScreen')}
        >
          {/* <Text style={styles.forgot}>Forgot your password?</Text> */}
        </TouchableOpacity>
      </View>
      <Button mode="contained" style={{backgroundColor: '#000'}} onPress={onLoginPressed}>
        Login
      </Button>
      {/* <View style={styles.row}>
        <Text>Don’t have an account? </Text>
        <TouchableOpacity onPress={() => navigation.replace('RegisterScreen')}>
          <Text style={styles.link}>Sign up</Text>
        </TouchableOpacity>
      </View> */}
    </Background>
  )
}

const styles = StyleSheet.create({
  forgotPassword: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    marginTop: 4,
  },
  forgot: {
    fontSize: 13,
    color: theme.colors.secondary,
  },
  link: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
})