import React, { useState, useEffect, useContext } from "react";
import { StyleSheet } from "react-native";
import Background from "../components/generate/Background";
import Logo from "../components/generate/Logo";
import Button from "../components/generate/Button";
import TextField from "../components/generate/TextField";
import { theme } from "../core/theme";
import { nameValidator } from "../helpers/nameValidator";
import { passwordValidator } from "../helpers/passwordValidator";
import { AuthContext } from "../context/AuthProvider";
import { LanguageContext } from "../components/Language";

export const LoginScreen = ({ navigation }) => {
  const { login, loginError } = useContext(AuthContext);
  const [credentials, setCredentials] = useState({});

  const [name, setName] = useState({ value: "", error: "" });
  const [password, setPassword] = useState({ value: "", error: "" });
  const { dictionary } = useContext(LanguageContext);

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
      <Logo />
      <TextField
        label="User name"
        returnKeyType="done"
        clearButtonMode='always'
        value={name.value}
        onChangeText={(text) => setName({ value: text, error: "" })}
        error={!!name.error}
        errorText={name.error}
        autoCapitalize="none"
      />
      <TextField
        label="Password"
        returnKeyType="done"
        clearButtonMode='always'
        value={password.value}
        onChangeText={(text) => setPassword({ value: text, error: "" })}
        error={!!password.error}
        errorText={password.error}
        secureTextEntry={true}
      />
      <Button
        mode="contained"
        style={{ backgroundColor: "#000" }}
        onPress={onLoginPressed}
      >
        {dictionary['login']}
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
