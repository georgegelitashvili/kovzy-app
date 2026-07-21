import React, { useState, useEffect, useContext } from "react";
import { View, StyleSheet } from "react-native";
import Background from "../components/generate/Background";
import Logo from "../components/generate/Logo";
import { Button } from "react-native-paper";
import TextField from "../components/generate/TextField";
import { theme } from "../core/theme";
import { AuthContext } from "../context/AuthProvider";
import { LanguageContext } from "../components/Language";

export const LoginScreen = ({ navigation }) => {
  const { login, loginError, intervalId } = useContext(AuthContext);
  const [name, setName] = useState({ value: "", error: false });
  const [password, setPassword] = useState({ value: "", error: false });
  const { dictionary } = useContext(LanguageContext);

  const onLoginPressed = () => {
    const nameInvalid = !name.value.trim();
    const passwordInvalid = !password.value || password.value.length < 4;

    if (nameInvalid || passwordInvalid) {
      setName((prev) => ({ ...prev, error: nameInvalid }));
      setPassword((prev) => ({ ...prev, error: passwordInvalid }));
      return;
    }

    setName((prev) => ({ ...prev, error: false }));
    setPassword((prev) => ({ ...prev, error: false }));
    login(name.value, password.value);
  };

  useEffect(() => {
    if (!loginError || typeof loginError !== "object") return;

    if (loginError.clearUsername) {
      setName({ value: "", error: true });
      setPassword({ value: "", error: true });
    } else {
      setName((prev) => ({
        ...prev,
        error: Boolean(loginError.highlightUsername),
      }));
      setPassword((prev) => ({
        ...prev,
        error: Boolean(loginError.highlightPassword),
      }));
    }

    clearInterval(intervalId);
  }, [loginError, intervalId]);

  return (
    <View style={styles.screen}>
      <Background>
        <Logo />
        <TextField
          label="User name"
          returnKeyType="done"
          clearButtonMode="always"
          value={name.value}
          onChangeText={(text) => setName({ value: text, error: false })}
          error={name.error}
          autoCapitalize="none"
        />
        <TextField
          label="Password"
          returnKeyType="done"
          clearButtonMode="always"
          value={password.value}
          onChangeText={(text) => setPassword({ value: text, error: false })}
          error={password.error}
          secureTextEntry={true}
        />
        <Button
          mode="contained"
          textColor="white"
          buttonColor="#000"
          onPress={onLoginPressed}
        >
          {dictionary["login"]}
        </Button>
      </Background>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
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
