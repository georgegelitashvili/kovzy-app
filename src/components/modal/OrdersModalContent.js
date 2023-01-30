import React, { useState} from 'react';
import { Text, TextInput, Button } from 'react-native-paper';
import { StyleSheet, View, Keyboard, TouchableWithoutFeedback } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';


export default function OrdersModalContent() {
    const [text, setText] = useState("");

    const Dropdown = () => {
      return (
        <RNPickerSelect
        style={{...pickerSelectStyles}}
            onValueChange={(value) => console.log(value)}
            items={[
                { label: 'Football', value: '1' },
                { label: 'Baseball', value: '2' },
                { label: 'Hockey', value: '3' },
            ]}
        />
      );
  };

    return (
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.content}>
          <Text style={styles.contentTitle}>"დადასტურება" ღილაკზე დაჭერით დაადასტურებთ შეკვეთას</Text>
          <TextInput
              label="შეკვეთის მიწოდების დრო (კლიენტისთვის)"
              value={text}
              onChangeText={text => setText(text)}
              mode="outlined"
              style={styles.contentInput}
              />

          <TextInput
              label="შეკვეთის მომზადების დრო (კურიერისთვის) "
              value={text}
              onChangeText={text => setText(text)}
              mode="outlined"
              style={styles.contentInput}
              />

              <Dropdown />
        </View>
        </TouchableWithoutFeedback>
    );
  };


  const styles = StyleSheet.create({
    content: {
      flex: 0.6,
      backgroundColor: 'white',
      width: "100%",
      padding: 20,
      alignItems: 'center',
      borderRadius: 13,
      borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    contentTitle: {
      fontSize: 18,
      marginTop: 20,
      marginBottom: 20,
    },
    contentInput: {
      width: "100%",
      backgroundColor: "#fff",
      marginBottom: 25,
      paddingLeft: 1,
      fontSize: 14,
    },
  });


  const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
      fontSize: 16,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: 'gray',
      borderRadius: 4,
      color: 'black',
      paddingRight: 30,
    },
    inputAndroid: {
      fontSize: 16,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderWidth: 0.5,
      borderColor: 'gray',
      borderRadius: 8,
      color: 'black',
      paddingRight: 30,
    },
  });