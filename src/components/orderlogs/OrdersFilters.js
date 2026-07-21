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

    // If only one date is selected, use it for both start and end date (single day filter)
    // If two dates are selected, use them as a range
    const newFilters = {
      orderStatus,
      startDate: dateRange.startDate ? dateRange.startDate.toISOString().split("T")[0] : null,
      endDate: dateRange.endDate 
        ? dateRange.endDate.toISOString().split("T")[0] 
        : (dateRange.startDate ? dateRange.startDate.toISOString().split("T")[0] : null),
    };
    onApplyFilters(newFilters);
  }, [onApplyFilters, dateRange, isPreparedSelected, isCancelledSelected, dictionary]);

  const handleDayPress = (day) => {
    const { startDate, endDate } = dateRange;
    const selectedDate = new Date(day.dateString);
    
    // If no date is selected or both dates are selected (complete range), start new selection
    if (!startDate || (startDate && endDate)) {
      setDateRange({ startDate: selectedDate, endDate: null });
    } 
    // If only start date is selected
    else if (startDate && !endDate) {
      // If same date is clicked again, treat it as single date selection
      if (selectedDate.toISOString() === startDate.toISOString()) {
        setDateRange({ startDate: selectedDate, endDate: selectedDate });
      } 
      // If earlier date is selected, make it the new start date
      else if (selectedDate < startDate) {
        setDateRange({ startDate: selectedDate, endDate: startDate });
      } 
      // If later date is selected, make it the end date
      else {
        setDateRange({ ...dateRange, endDate: selectedDate });
      }
    }
  };

  const generateMarkedDates = useMemo(() => {
    let marked = {};

    if (dateRange.startDate) {
      const startDateStr = dateRange.startDate.toISOString().split("T")[0];
      
      // If we have both start and end date (range selection)
      if (dateRange.endDate) {
        const endDateStr = dateRange.endDate.toISOString().split("T")[0];
        
        marked[startDateStr] = {
          startingDay: true,
          color: "green",
          textColor: "white",
        };

        // If start and end dates are the same (single date selection)
        if (startDateStr === endDateStr) {
          marked[startDateStr] = {
            selected: true,
            selectedColor: "green",
          };
        } 
        // If different dates (range selection)
        else {
          marked[endDateStr] = {
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
      } 
      // If only start date is selected (waiting for second selection)
      else {
        marked[startDateStr] = {
          selected: true,
          selectedColor: "green",
        };
      }
    }

    return marked;
  }, [dateRange]);

  const handleMonthChange = (month) => {
    const updatedMonth = `${new Date().getFullYear()}-${month.toString().padStart(2, "0")}-01`;
    setCurrentMonth(updatedMonth);
  };

  const clearDateRange = () => {
    setDateRange({ startDate: null, endDate: null });
  };

  const monthOptions = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      label: new Date(2024, i, 1).toLocaleString(userLanguage, { month: "long" }),
      value: (i + 1).toString().padStart(2, "0"),
    })), [userLanguage]);

  const formatDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString(userLanguage, { day: "numeric", month: "short", year: "numeric" });
  };

  const dateRangeText = dateRange.startDate 
    ? (dateRange.endDate 
        ? (dateRange.startDate.toISOString() === dateRange.endDate.toISOString()
            ? formatDate(dateRange.startDate)
            : `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`)
        : formatDate(dateRange.startDate))
    : dictionary["filter.selectDateRange"];

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{dictionary["filter.orderStatus"]}</Text>
      <View style={styles.statusRow}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setIsPreparedSelected(!isPreparedSelected)}
          accessibilityLabel={dictionary["filter.prepared"]}
        >
          <View style={[styles.checkbox, isPreparedSelected && styles.checkboxSelected]}>
            {isPreparedSelected && <Text style={styles.checkboxIcon}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>{dictionary["filter.prepared"]}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setIsCancelledSelected(!isCancelledSelected)}
          accessibilityLabel={dictionary["filter.cancelled"]}
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
          accessibilityLabel="Select Date Range"
        >
          <Text style={styles.dateRangeText}>{dateRangeText}</Text>
        </TouchableOpacity>
        {dateRange.startDate && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearDateRange}
            accessibilityLabel="Clear Date Range"
          >
            <Text style={styles.clearButtonText}>X</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={isCalendarVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
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
              markedDates={generateMarkedDates}
              markingType={dateRange.endDate ? "period" : "simple"}
            />

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsCalendarVisible(false)}
              accessibilityLabel="Close Calendar"
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
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    margin: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: { fontSize: 14, marginBottom: 1 },
  statusRow: { flexDirection: "row", alignItems: "center", padding: 5 },
  checkboxContainer: { flexDirection: "row", alignItems: "center", marginVertical: 5, marginRight: 10 },
  checkbox: { width: 20, height: 20, borderWidth: 1, borderColor: "gray", borderRadius: 4, justifyContent: "center", alignItems: "center", marginRight: 10 },
  checkboxSelected: { backgroundColor: "#006400", borderColor: "#006400" },
  checkboxIcon: { color: "white", fontSize: 14 },
  checkboxLabel: { fontSize: 14 },
  dateRangeContainer: { flexDirection: "row", alignItems: "center", marginVertical: 5 },
  dateRangeButton: { flex: 1, borderWidth: 1, borderColor: "gray", borderRadius: 5, padding: 10, alignItems: "center" },
  dateRangeText: { fontSize: 14 },
  clearButton: { marginLeft: 10, padding: 10, backgroundColor: "#FF0000", borderRadius: 5 },
  clearButtonText: { color: "white", fontSize: 14 },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.5)" },
  modalContent: { width: "90%", backgroundColor: "white", borderRadius: 10, padding: 20 },
  modalCloseButton: { marginTop: 10, padding: 10, backgroundColor: "#006400", borderRadius: 5, alignItems: "center" },
  modalCloseButtonText: { color: "white", fontSize: 16 },
  picker: { fontSize: 16, padding: 10, borderBottomWidth: 1, borderBottomColor: "gray" },
});

export default React.memo(OrdersFilters);