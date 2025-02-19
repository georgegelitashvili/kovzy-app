import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { LanguageContext } from "../Language";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const OrdersFilters = ({ onApplyFilters, filters }) => {
  const { dictionary } = useContext(LanguageContext);
  const [orderType, setOrderType] = useState(filters.orderType || "0");
  const [orderStatus, setOrderStatus] = useState(filters.orderStatus || "0");
  const [startDate, setStartDate] = useState(filters.startDate ? new Date(filters.startDate) : null);
  const [endDate, setEndDate] = useState(filters.endDate ? new Date(filters.endDate) : null);
  const [firstName, setFirstName] = useState(filters.firstName || "");
  const [lastName, setLastName] = useState(filters.lastName || "");
  const [isStartDateVisible, setIsStartDateVisible] = useState(false);
  const [isEndDateVisible, setIsEndDateVisible] = useState(false);

  const formatDate = (date) => {
    if (!date) return "";
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const applyFilters = () => {
    if (!onApplyFilters) {
      console.error("onApplyFilters function is not provided");
      return;
    }

    if (startDate && endDate && startDate > endDate) {
      alert(dictionary["filter.dateRangeError"]);
      return;
    }

    const newFilters = {
      orderType,
      orderStatus,
      firstName,
      lastName,
      startDate: startDate ? startDate.toISOString().split("T")[0] : null,
      endDate: endDate ? endDate.toISOString().split("T")[0] : null,
    };
    onApplyFilters(newFilters);
  };

  const showStartDatePicker = () => setIsStartDateVisible(true);
  const hideStartDatePicker = () => setIsStartDateVisible(false);
  const handleStartDateConfirm = (date) => {
    setStartDate(date);
    hideStartDatePicker();
  };

  const showEndDatePicker = () => setIsEndDateVisible(true);
  const hideEndDatePicker = () => setIsEndDateVisible(false);
  const handleEndDateConfirm = (date) => {
    setEndDate(date);
    hideEndDatePicker();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>{dictionary["filter.orderType"]}</Text>
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

        <Text style={styles.label}>{dictionary["filter.orderStatus"]}</Text>
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

        <Text style={styles.label}>{dictionary["filter.startDate"]}</Text>
        <View style={styles.dateContainer}>
          <TouchableOpacity onPress={showStartDatePicker} style={styles.dateButton}>
            <Text style={styles.dateButtonText}>
              {startDate ? formatDate(startDate) : dictionary["filter.selectDate"]}
            </Text>
          </TouchableOpacity>
          {startDate && (
            <TouchableOpacity onPress={() => setStartDate(null)} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>{dictionary["filter.clear"]}</Text>
            </TouchableOpacity>
          )}
        </View>
        <DateTimePickerModal
          isVisible={isStartDateVisible}
          mode="date"
          date={startDate || new Date()}
          onConfirm={handleStartDateConfirm}
          onCancel={hideStartDatePicker}
        />

        <Text style={styles.label}>{dictionary["filter.endDate"]}</Text>
        <View style={styles.dateContainer}>
          <TouchableOpacity onPress={showEndDatePicker} style={styles.dateButton}>
            <Text style={styles.dateButtonText}>
              {endDate ? formatDate(endDate) : dictionary["filter.selectDate"]}
            </Text>
          </TouchableOpacity>
          {endDate && (
            <TouchableOpacity onPress={() => setEndDate(null)} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>{dictionary["filter.clear"]}</Text>
            </TouchableOpacity>
          )}
        </View>
        <DateTimePickerModal
          isVisible={isEndDateVisible}
          mode="date"
          date={endDate || new Date()}
          onConfirm={handleEndDateConfirm}
          onCancel={hideEndDatePicker}
        />

        <Text style={styles.label}>{dictionary["filter.firstName"]}</Text>
        <TextInput
          placeholder={dictionary["filter.enterFirstName"]}
          value={firstName}
          onChangeText={setFirstName}
          style={styles.input}
        />

        <Text style={styles.label}>{dictionary["filter.lastName"]}</Text>
        <TextInput
          placeholder={dictionary["filter.enterLastName"]}
          value={lastName}
          onChangeText={setLastName}
          style={styles.input}
        />

        <TouchableOpacity style={styles.filterButton} onPress={applyFilters}>
          <Text style={styles.filterButtonText}>{dictionary["filter.applyFilters"]}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%", 
    backgroundColor: "white", 
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 20, 
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
    width: "100%", 
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
    width: "100%",
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
  },
  dateButtonText: {
    fontSize: 16,
  },
  clearButton: {
    backgroundColor: "red",
    padding: 10,
    borderRadius: 5,
  },
  clearButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  filterButton: {
    backgroundColor: "#006400",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
    width: "100%", 
  },
  filterButtonText: {
    color: "white",
    fontSize: 16,
  },
});


const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
    width: "100%",
  },
  inputAndroid: {
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
    width: "100%", 
  },
});

export default React.memo(OrdersFilters);