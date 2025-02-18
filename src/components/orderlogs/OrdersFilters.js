import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { LanguageContext } from "../Language";
// import DatePicker from 'react-native-date-picker';

const OrdersFilters = ({ onApplyFilters, filters }) => {
  const { dictionary } = useContext(LanguageContext);
  const [orderType, setOrderType] = useState(filters.orderType || "all");
  const [orderStatus, setOrderStatus] = useState(filters.orderStatus || "all");
//   const [startDate, setStartDate] = useState(new Date());
//   const [endDate, setEndDate] = useState(new Date());
  const [firstName, setFirstName] = useState(filters.firstName || "");
  const [lastName, setLastName] = useState(filters.lastName || "");

  const applyFilters = () => {
    const newFilters = {
      orderType,
      orderStatus,
      firstName,
      lastName,
    //   dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
    };
    onApplyFilters(newFilters);
  };

  return (
    <View style={{ padding: 10, borderWidth: 3, borderColor: '#006400', borderRadius: 5 }}>
      <Text>{dictionary["filter.orderType"]}</Text>
      <RNPickerSelect
        onValueChange={(val) => setOrderType(val)}
        items={[
          { label: dictionary["filter.onlineOrder"], value: "0" },
          { label: dictionary["filter.qrOrder"], value: "1" },
        ]}
        value={orderType}
        placeholder={{ label: dictionary["filter.selectOrderType"], value: null }}
        style={pickerSelectStyles}
      />

      <Text>{dictionary["filter.orderStatus"]}</Text>
      <RNPickerSelect
        onValueChange={(val) => setOrderStatus(val)}
        items={[
          { label: dictionary["filter.pending"], value: "0" },
          { label: dictionary["filter.accepted"], value: "1" },
          { label: dictionary["filter.prepared"], value: "2" },
          { label: dictionary["filter.cancelled"], value: "-1" },
        ]}
        value={orderStatus}
        placeholder={{ label: dictionary["filter.selectOrderStatus"], value: null }}
        style={pickerSelectStyles}
      />

      {/* <Text>{dictionary["filter.dateRange"]}</Text>
      <DatePicker
        date={startDate}
        onDateChange={setStartDate}
        mode="date"
        style={{ marginBottom: 10 }}
      />
      <DatePicker
        date={endDate}
        onDateChange={setEndDate}
        mode="date"
        style={{ marginBottom: 10 }}
      /> */}

      <Text>{dictionary["filter.firstName"]}</Text>
      <TextInput
        placeholder={dictionary["filter.enterFirstName"]}
        value={firstName}
        onChangeText={setFirstName}
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />

      {/* Last Name Filter */}
      <Text>{dictionary["filter.lastName"]}</Text>
      <TextInput
        placeholder={dictionary["filter.enterLastName"]}
        value={lastName}
        onChangeText={setLastName}
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />

      {/* Apply Filters Button */}
      <TouchableOpacity style={styles.filterButton} onPress={applyFilters}>
        <Text style={styles.filterButtonText}>{dictionary["filter.applyFilters"]}</Text>
      </TouchableOpacity>
    </View>
  );
};

// Styles for RNPickerSelect
const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
  },
  inputAndroid: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
  },
});

// Styles for the component
const styles = StyleSheet.create({
  filterButton: {
    backgroundColor: '#006400',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  filterButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default OrdersFilters;