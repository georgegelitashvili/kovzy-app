import React, { useState, useContext, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from "react-native";
import { Calendar } from "react-native-calendars";
import { LanguageContext } from "../Language";

const OrdersFilters = ({ onApplyFilters, filters }) => {
  const { dictionary } = useContext(LanguageContext);
  const [isPreparedSelected, setIsPreparedSelected] = useState(true); // Default to "Prepared" (status 2)
  const [isCancelledSelected, setIsCancelledSelected] = useState(false);

  const [dateRange, setDateRange] = useState({
    startDate: filters.startDate ? new Date(filters.startDate) : null,
    endDate: filters.endDate ? new Date(filters.endDate) : null,
  });
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);

  useEffect(() => {
    applyFilters();
  }, [isPreparedSelected, isCancelledSelected, dateRange]);

  const applyFilters = useCallback(() => {
    if (!onApplyFilters) {
      console.error("onApplyFilters function is not provided");
      return;
    }

    if (dateRange.startDate && dateRange.endDate && dateRange.startDate > dateRange.endDate) {
      alert(dictionary["filter.dateRangeError"]);
      return;
    }
    let orderStatuses = [];
    if (isPreparedSelected) orderStatuses.push("2"); // Prepared
    if (isCancelledSelected) orderStatuses.push("-1"); // Cancelled

    // If both are selected, send all statuses
    const orderStatus = orderStatuses.length === 2 ? "all" : orderStatuses.join(",");

    const newFilters = {
      orderStatus,
      startDate: dateRange.startDate ? dateRange.startDate.toISOString().split("T")[0] : null,
      endDate: dateRange.endDate ? dateRange.endDate.toISOString().split("T")[0] : null,
    };
    onApplyFilters(newFilters);
  }, [onApplyFilters, dateRange, isPreparedSelected, isCancelledSelected, dictionary]);

  const handleDayPress = (day) => {
    const { startDate, endDate } = dateRange;
    const selectedDate = new Date(day.dateString);

    if (!startDate || (startDate && endDate)) {
      // If no start date is selected or both start and end dates are selected, reset the range
      setDateRange({ startDate: selectedDate, endDate: null });
    } else if (selectedDate.toISOString() === startDate.toISOString()) {
      // If the selected date is the same as the start date, clear the start date
      setDateRange({ startDate: null, endDate: null });
    } else if (selectedDate < startDate) {
      // If the selected date is before the start date, set it as the new start date
      setDateRange({ startDate: selectedDate, endDate: null });
    } else {
      // If the selected date is after the start date, set it as the end date
      setDateRange({ ...dateRange, endDate: selectedDate });
    }
  };

  const clearDateRange = () => {
    setDateRange({ startDate: null, endDate: null });
  };

  // Format marked dates for the calendar
  const markedDates = {};
  if (dateRange.startDate) {
    const startDateStr = dateRange.startDate.toISOString().split("T")[0];
    markedDates[startDateStr] = { startingDay: true, color: "green", textColor: "white" };
  }
  if (dateRange.endDate) {
    const endDateStr = dateRange.endDate.toISOString().split("T")[0];
    markedDates[endDateStr] = { endingDay: true, color: "green", textColor: "white" };
  }
  if (dateRange.startDate && dateRange.endDate) {
    // Highlight the range between start and end dates
    let currentDate = new Date(dateRange.startDate);
    while (currentDate <= dateRange.endDate) {
      const currentDateStr = currentDate.toISOString().split("T")[0];
      if (!markedDates[currentDateStr]) {
        markedDates[currentDateStr] = { color: "lightgreen", textColor: "black" };
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  // Format the selected date range for display
  const selectedRangeText =
    dateRange.startDate && dateRange.endDate
      ? `${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`
      : dictionary["filter.selectDateRange"];

  return (
    <View contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>{dictionary["filter.orderStatus"]}</Text>
      <View style={styles.statusRow}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setIsPreparedSelected(!isPreparedSelected)}
        >
          <View style={[styles.checkbox, isPreparedSelected && styles.checkboxSelected]}>
            {isPreparedSelected && <Text style={styles.checkboxIcon}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>{dictionary["filter.prepared"]}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setIsCancelledSelected(!isCancelledSelected)}
        >
          <View style={[styles.checkbox, isCancelledSelected && styles.checkboxSelected]}>
            {isCancelledSelected && <Text style={styles.checkboxIcon}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>{dictionary["filter.cancelled"]}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dateRangeContainer}>
        <View style={styles.dateRangeButtonContainer}>
          <TouchableOpacity
            style={styles.dateRangeButton}
            onPress={() => setIsCalendarVisible(true)}
          >
            <Text style={styles.dateRangeText}>{selectedRangeText}</Text>
          </TouchableOpacity>
          {dateRange.startDate && (
            <TouchableOpacity style={styles.clearButton} onPress={clearDateRange}>
              <Text style={styles.clearButtonText}>X</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Modal visible={isCalendarVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Calendar
              onDayPress={handleDayPress}
              markedDates={markedDates}
              markingType="period"
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsCalendarVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    padding: 10,
    backgroundColor: "white",
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 7,
  },
  label: {
    fontSize: 14,
    marginBottom: 1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
    marginRight: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checkboxSelected: {
    backgroundColor: "#006400",
    borderColor: "#006400",
  },
  checkboxIcon: {
    color: "white",
    fontSize: 14,
  },
  checkboxLabel: {
    fontSize: 14,
  },
  dateRangeContainer: {
    marginVertical: 5,
  },
  dateRangeButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateRangeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
    padding: 5,
    alignItems: "center",
  },
  dateRangeText: {
    fontSize: 14,
  },
  clearButton: {
    marginLeft: 10,
    padding: 7,
    backgroundColor: "#FF0000",
    borderRadius: 5,
  },
  clearButtonText: {
    color: "white",
    fontSize: 13,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
  },
  modalCloseButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#006400",
    borderRadius: 5,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "white",
    fontSize: 16,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default React.memo(OrdersFilters);