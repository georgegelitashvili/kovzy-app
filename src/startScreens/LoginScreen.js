import React, { useState, useEffect, useContext } from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import Background from "../components/generate/Background";
import Header from "../components/generate/Header";
import Button from "../components/generate/Button";
import TextField from "../components/generate/TextField";
import { theme } from "../core/theme";
import { nameValidator } from "../helpers/nameValidator";
import { passwordValidator } from "../helpers/passwordValidator";
import { AuthContext, AuthProvider } from "../context/AuthProvider";

// 'alexander.tsintsadze'
// '700309

export const LoginScreen = ({ navigation }) => {
  const { login, loginError } = useContext(AuthContext);

  const [name, setName] = useState({ value: "", error: "" });
  const [password, setPassword] = useState({ value: "", error: "" });

  const [options, setOptions] = useState({});
  const [optionsIsLoaded, setOptionsIsLoaded] = useState(false);

  // login function
  const onLoginPressed = () => {
    const nameError = nameValidator(name.value);
    const passwordError = passwordValidator(password.value);

    if (nameError || passwordError) {
      setName({ ...name, error: nameError });
      setPassword({ ...password, error: passwordError });
      return;
    }

    if (optionsIsLoaded) {
      login(name.value, password.value);
      setOptionsIsLoaded(false);
    }
  };

  // if name or password changed
  useEffect(() => {
    if (name && password) {
      setOptions((prev) => ({
        ...prev,
        data: { username: name.value, password: password.value },
      }));
      setOptionsIsLoaded(true);
    }
  }, [name, password]);

  useEffect(() => {
    if (loginError?.length != 0) {
      setName({
        ...name,
        error:
          typeof loginError === "object" && loginError !== null
            ? loginError.username[0]
            : "",
      });
      setPassword({
        ...password,
        error:
          typeof loginError === "object" && loginError !== null
            ? ""
            : loginError,
      });
    }
  }, [loginError]);

  return (
    <Background>
      <Header style={{ color: "#000" }}>Welcome to the kovzy app</Header>
      <TextField
        label="User name"
        returnKeyType="next"
        value={name?.value || ""}
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
        value={password?.value || ""}
        onChangeText={(text) => setPassword({ value: text, error: "" })}
        error={!!password.error}
        errorText={password.error}
        secureTextEntry={true}
      />
      <View style={styles.forgotPassword}>
        <TouchableOpacity
          onPress={() => navigation.navigate("ResetPasswordScreen")}
        >
          {/* <Text style={styles.forgot}>Forgot your password?</Text> */}
        </TouchableOpacity>
      </View>
      <Button
        mode="contained"
        style={{ backgroundColor: "#000" }}
        onPress={onLoginPressed}
      >
        Login
      </Button>
      {/* <View style={styles.row}>
        <Text>Don’t have an account? </Text>
        <TouchableOpacity onPress={() => navigation.replace('RegisterScreen')}>
          <Text style={styles.link}>Sign up</Text>
        </TouchableOpacity>
      </View> */}
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
