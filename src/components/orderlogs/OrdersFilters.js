import React, { useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { LanguageContext } from "../Language";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const OrdersFilters = ({ onApplyFilters, filters }) => {
  const { dictionary } = useContext(LanguageContext);
  const [orderStatus, setOrderStatus] = useState(filters.orderStatus || "2");
  const [startDate, setStartDate] = useState(filters.startDate ? new Date(filters.startDate) : null);
  const [endDate, setEndDate] = useState(filters.endDate ? new Date(filters.endDate) : null);
  const [isStartDateVisible, setIsStartDateVisible] = useState(false);
  const [isEndDateVisible, setIsEndDateVisible] = useState(false);

  const formatDate = useCallback((date) => {
    if (!date) return "";
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }, []);

  const applyFilters = useCallback(() => {
    if (!onApplyFilters) {
      console.error("onApplyFilters function is not provided");
      return;
    }

    if (startDate && endDate && startDate > endDate) {
      alert(dictionary["filter.dateRangeError"]);
      return;
    }

    const newFilters = {
      orderStatus,
      startDate: startDate ? startDate.toISOString().split("T")[0] : null,
      endDate: endDate ? endDate.toISOString().split("T")[0] : null,
    };
    onApplyFilters(newFilters);
  }, [onApplyFilters, startDate, endDate, orderStatus, dictionary]);

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
        <View style = {styles.statusRow}>
        <Text style={styles.label}>{dictionary["filter.orderStatus"]}</Text>
        <RNPickerSelect
          onValueChange={setOrderStatus}
          items={[
            { label: dictionary["filter.prepared"], value: "2" },
            { label: dictionary["filter.cancelled"], value: "-1" },
          ]}
          value={orderStatus}
          placeholder={{ label: dictionary["filter.selectOrderStatus"], value: null }}
          style={pickerSelectStyles}
        />
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateColumn}>
            <Text style={styles.label}>{dictionary["filter.startDate"]}</Text>
            <View style={styles.dateContainer}>
              <TouchableOpacity onPress={showStartDatePicker} style={styles.dateButton}>
                <Text style={styles.dateButtonText}>
                  {startDate ? formatDate(startDate) : dictionary["filter.selectDate"]}
                </Text>
              </TouchableOpacity>
              {startDate && (
                <TouchableOpacity onPress={() => setStartDate(null)} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>X</Text>
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
          </View>

          <View style={styles.dateColumn}>
            <Text style={styles.label}>{dictionary["filter.endDate"]}</Text>
            <View style={styles.dateContainer}>
              <TouchableOpacity onPress={showEndDatePicker} style={styles.dateButton}>
                <Text style={styles.dateButtonText}>
                  {endDate ? formatDate(endDate) : dictionary["filter.selectDate"]}
                </Text>
              </TouchableOpacity>
              {endDate && (
                <TouchableOpacity onPress={() => setEndDate(null)} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>X</Text>
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
          </View>
        </View>

        <View style={styles.filterButtonContainer}>
        <TouchableOpacity style={styles.filterButton} onPress={applyFilters}>
          <Text style={styles.filterButtonText}>{dictionary["filter.applyFilters"]}</Text>
        </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "white",
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 1,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 20,
    width: "100%",
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
    padding: 8,
    alignItems: "center",
  },
  dateButtonText: {
    fontSize: 14,
  },
  clearButton: {
    backgroundColor: "red",
    padding: 8,
    borderRadius: 5,
  },
  clearButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  filterButtonContainer:{
    alignItems: "center",
  },

  statusRow:{
    padding: 5,
  },

  filterButton: {
    backgroundColor: "#006400",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 7,
    width: "70%",
  },
  filterButtonText: {
    color: "white",
    fontSize: 16,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateColumn: {
    flex: 1,
    marginHorizontal: 5,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputAndroid: {
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
    padding: 8,
    marginBottom: 10,
    fontSize: 14,
    width: "100%",
  },
});

export default React.memo(OrdersFilters);