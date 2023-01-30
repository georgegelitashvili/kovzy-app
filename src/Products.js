import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  FlatList
} from "react-native";
import { Avatar, Text, Card, IconButton, Divider } from "react-native-paper";



export default function Products({ navigation })
{

  return (
    <Card.Title
      title="სამარხვო ოჯახური ვახშამი 5 ადამიანისთვის"
      right={(props) => <Avatar.Icon {...props} icon="check" style={styles.leftIcon} onPress={() => {}} />}
      style={styles.card}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",

    margin: 15,
    paddingVertical: 15,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowColor: "#14141405",
        shadowOpacity: 0.8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  leftIcon: {
    marginRight: 15,
    fontSize: 32,
  },
});
