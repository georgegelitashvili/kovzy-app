import React, { useState, useContext, useCallback, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { Calendar } from "react-native-calendars";
import RNPickerSelect from "react-native-picker-select";
import { LanguageContext } from "../Language";

const OrdersFilters = ({ onApplyFilters, filters }) => {
  const { dictionary, userLanguage } = useContext(LanguageContext);
  const [isPreparedSelected, setIsPreparedSelected] = useState(true);
  const [isCancelledSelected, setIsCancelledSelected] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: filters.startDate ? new Date(filters.startDate) : null,
    endDate: filters.endDate ? new Date(filters.endDate) : null,
  });
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().split("T")[0]); // Default to today

  console.log(userLanguage);
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
    if (isPreparedSelected) orderStatuses.push("2");
    if (isCancelledSelected) orderStatuses.push("-1");

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
      setDateRange({ startDate: selectedDate, endDate: null });
    } else if (selectedDate.toISOString() === startDate.toISOString()) {
      setDateRange({ startDate: null, endDate: null });
    } else if (selectedDate < startDate) {
      setDateRange({ startDate: selectedDate, endDate: null });
    } else {
      setDateRange({ ...dateRange, endDate: selectedDate });
    }
  };

  const generateMarkedDates = () => {
    let marked = {};

    if (dateRange.startDate) {
      marked[dateRange.startDate.toISOString().split("T")[0]] = {
        startingDay: true,
        color: "green",
        textColor: "white",
      };
    }

    if (dateRange.endDate) {
      marked[dateRange.endDate.toISOString().split("T")[0]] = {
        endingDay: true,
        color: "green",
        textColor: "white",
      };

      let current = new Date(dateRange.startDate);
      current.setDate(current.getDate() + 1);

      while (current < dateRange.endDate) {
        const dateStr = current.toISOString().split("T")[0];
        marked[dateStr] = { color: "lightgreen", textColor: "black" };
        current.setDate(current.getDate() + 1);
      }
    }

    return marked;
  };

  const handleMonthChange = (month) => {
    const updatedMonth = `${new Date().getFullYear()}-${month.toString().padStart(2, "0")}-01`;
    setCurrentMonth(updatedMonth);
  };

  // Generate a list of months for selection
  const monthOptions = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      label: new Date(2024, i, 1).toLocaleString(userLanguage, { month: "long" }),
      value: (i + 1).toString().padStart(2, "0"),
    })), [userLanguage]);


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
        <TouchableOpacity
          style={styles.dateRangeButton}
          onPress={() => setIsCalendarVisible(true)}
        >
          <Text style={styles.dateRangeText}>Select Date Range</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isCalendarVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Month Selector */}
            <RNPickerSelect
              onValueChange={handleMonthChange}
              items={monthOptions}
              placeholder={{ label: dictionary["selectMonth"], value: null }}
              style={{
                inputIOS: styles.picker,
                inputAndroid: styles.picker,
              }}
            />

            {/* Calendar Component */}
            <Calendar
              key={currentMonth}
              current={currentMonth}
              locale={userLanguage}
              onMonthChange={(month) => setCurrentMonth(`${month.year}-${month.month.toString().padStart(2, "0")}-01`)}
              renderHeader={(date) => {
                return (
                  <Text style={{ fontSize: 18 }}>
                    {new Date(date).toLocaleString(userLanguage, { month: "long", year: "numeric" })}
                  </Text>
                );
              }}
              onDayPress={handleDayPress}
              markedDates={generateMarkedDates()}
              markingType="period"
            />

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsCalendarVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>{dictionary["done"]}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: { flexGrow: 1, padding: 7 },
  label: { fontSize: 14, marginBottom: 1 },
  statusRow: { flexDirection: "row", alignItems: "center", padding: 5 },
  checkboxContainer: { flexDirection: "row", alignItems: "center", marginVertical: 5, marginRight: 10 },
  checkbox: { width: 20, height: 20, borderWidth: 1, borderColor: "gray", borderRadius: 4, justifyContent: "center", alignItems: "center", marginRight: 10 },
  checkboxSelected: { backgroundColor: "#006400", borderColor: "#006400" },
  checkboxIcon: { color: "white", fontSize: 14 },
  checkboxLabel: { fontSize: 14 },
  dateRangeContainer: { marginVertical: 5 },
  dateRangeButton: { borderWidth: 1, borderColor: "gray", borderRadius: 5, padding: 10, alignItems: "center" },
  dateRangeText: { fontSize: 14 },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.5)" },
  modalContent: { width: "90%", backgroundColor: "white", borderRadius: 10, padding: 20 },
  modalCloseButton: { marginTop: 10, padding: 10, backgroundColor: "#006400", borderRadius: 5, alignItems: "center" },
  modalCloseButtonText: { color: "white", fontSize: 16 },
  picker: { fontSize: 16, padding: 10, borderBottomWidth: 1, borderBottomColor: "gray" },
});

export default React.memo(OrdersFilters);
