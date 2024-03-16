import React, { useState, useEffect, useContext } from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import * as SecureStore from 'expo-secure-store';
import Background from "../components/generate/Background";
import Header from "../components/generate/Header";
import Button from "../components/generate/Button";
import TextField from "../components/generate/TextField";
import { theme } from "../core/theme";
import { nameValidator } from "../helpers/nameValidator";
import { passwordValidator } from "../helpers/passwordValidator";
import { AuthContext } from "../context/AuthProvider";

export const LoginScreen = ({ navigation }) => {
  const { login, loginError, intervalId } = useContext(AuthContext);
  const [credentials, setCredentials] = useState({});

  const [name, setName] = useState({ value: "", error: "" });
  const [password, setPassword] = useState({ value: "", error: "" });

  // login function
  const onLoginPressed = () => {
    const nameError = nameValidator(name.value);
    const passwordError = passwordValidator(password.value);

    if (nameError || passwordError) {
      setName({ ...name, error: nameError });
      setPassword({ ...password, error: passwordError });
      return;
    }

    login(name.value, password.value);
  };

  useEffect(() => {
    clearInterval(intervalId);
  });

  useEffect(() => {
    SecureStore.getItemAsync("credentials").then((obj) => {
      if (obj) {
        setCredentials(JSON.parse(obj));
      }
    });
    clearInterval(intervalId);
  }, [])

  useEffect(() => {
    if (credentials) {
      // Set the message to the state or handle it accordingly
      setName({ value: credentials.username, error: "" });
      setPassword({ value: credentials.password, error: "" });
    }
  }, [credentials]);

  useEffect(() => {
    if (loginError) {
      let usernameError = "";
      let passwordError = "";

      if (typeof loginError === "object" && loginError !== null) {
        usernameError = loginError.username ? loginError.username[0] : "";
        passwordError = loginError.password ? loginError.password[0] : "";
      } else {
        passwordError = loginError;
      }

      setName({ ...name, error: usernameError });
      setPassword({ ...password, error: passwordError });
    }
  }, [loginError]);

  return (
    <Background>
      <Header style={{ color: "#000" }}>Welcome to the kovzy app</Header>
      <TextField
        label="User name"
        returnKeyType="next"
        value={name.value}
        onChangeText={(text) => setName({ value: text, error: "" })}
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
        value={password.value}
        onChangeText={(text) => setPassword({ value: text, error: "" })}
        error={!!password.error}
        errorText={password.error}
        secureTextEntry={true}
      />
      <View style={styles.forgotPassword}>
        <TouchableOpacity
          onPress={() => navigation.navigate("ResetPasswordScreen")}
        >
        </TouchableOpacity>
      </View>
      <Button
        mode="contained"
        style={{ backgroundColor: "#000" }}
        onPress={onLoginPressed}
      >
        Login
      </Button>
    </Background>
  );
};

const styles = StyleSheet.create({
  forgotPassword: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    marginTop: 4,
  },
  forgot: {
    fontSize: 13,
    color: theme.colors.secondary,
  },
  link: {
    fontWeight: "bold",
    color: theme.colors.primary,
  },
});
