import React, { useState, useRef, useEffect, useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TimerPicker } from "react-native-timer-picker";
import { LanguageContext } from "../Language";

const TimePicker = ({
    onDelaySet,
    onClose,
    scheduled,
    showButton,
    onChange,
    backgroundColor = "#F1F1F1",
    initialMinutes = 30,
}) => {
    const startingMinutes = Math.max(0, Number(initialMinutes) || 0);
    const [delayTime, setDelayTime] = useState(startingMinutes);
    const delayTimePickerRef = useRef(null);
    const [isVisibleDelayTimeHours, setIsVisibleDelayTimeHours] = useState(
        startingMinutes >= 60
    );
    const { dictionary } = useContext(LanguageContext);

    const handleDurationChange = (duration) => {
        const totalMinutes = duration.hours * 60 + duration.minutes;
        setDelayTime(totalMinutes);

        if (showButton === false) {
            onChange(totalMinutes);
        }
    };

    const handleIncreaseDelayTime = (minutesToAdd, showHours) => {
        if (showHours) {
            setTimeout(() => {
                delayTimePickerRef?.current?.setValue({
                    hours: Math.floor((delayTime + minutesToAdd) / 60),
                    minutes: (delayTime + minutesToAdd) % 60,
                });
            }, 500);
            setIsVisibleDelayTimeHours(true);
        }

        const updatedDelay = (delayTime + minutesToAdd) % (60 * 24);
        setDelayTime(updatedDelay);

        delayTimePickerRef?.current?.setValue({
            hours: Math.floor(updatedDelay / 60),
            minutes: updatedDelay % 60,
        });
    };

    const formatDelayTime = () => {
        const hours = Math.floor(delayTime / 60);
        const minutes = delayTime % 60;
        const seconds = 0;
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    // Sync React state when the prop changes. Picker UI remounts via key below.
    const prevInitialMinutesRef = useRef(startingMinutes);
    useEffect(() => {
        const minutes = Math.max(0, Number(initialMinutes) || 0);
        if (prevInitialMinutesRef.current === minutes) return;
        prevInitialMinutesRef.current = minutes;
        setDelayTime(minutes);
        setIsVisibleDelayTimeHours(minutes >= 60);
    }, [initialMinutes]);

    return (
        <View style={[styles.container, { backgroundColor }]}>
            {showButton && typeof onClose === "function" ? (
                <TouchableOpacity
                    style={styles.closeIconButton}
                    onPress={onClose}
                    hitSlop={10}
                >
                    <MaterialCommunityIcons name="close" size={24} color="#6c757d" />
                </TouchableOpacity>
            ) : null}

            <View style={styles.pickerContainer}>
                <TimerPicker
                    key={`delay-picker-${startingMinutes}`}
                    ref={delayTimePickerRef}
                    onDurationChange={handleDurationChange}
                    padWithNItems={1}
                    hideSeconds={true}
                    hideHours={!isVisibleDelayTimeHours}
                    initialValue={{
                        hours: Math.floor(startingMinutes / 60),
                        minutes: startingMinutes % 60,
                    }}
                    styles={{
                        pickerItem: { fontSize: 34 },
                        pickerContainer: {
                            backgroundColor,
                            marginRight: 6,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        },
                    }}
                />
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.addButton} onPress={() => handleIncreaseDelayTime(5)}>
                    <Text style={styles.buttonText}>+5 min</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addButton} onPress={() => handleIncreaseDelayTime(15)}>
                    <Text style={styles.buttonText}>+15 min</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addButton} onPress={() => handleIncreaseDelayTime(60, true)}>
                    <Text style={styles.buttonText}>+1 hour</Text>
                </TouchableOpacity>
            </View>
            {showButton ? (
                <View style={styles.confirmContainer}>
                    <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={() => onDelaySet(formatDelayTime())}
                    >
                        <Text style={styles.confirmText}>
                            {dictionary["orders.approve"] || "დადასტურება"}
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        paddingTop: 28,
        backgroundColor: "#fff",
        borderRadius: 10,
        position: "relative",
        width: "100%",
    },
    closeIconButton: {
        position: "absolute",
        top: 10,
        right: 10,
        zIndex: 2,
        padding: 4,
    },
    pickerContainer: {
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        paddingBottom: 20,
    },
    buttonContainer: {
        flexDirection: "row",
        marginTop: 20,
    },
    addButton: {
        backgroundColor: "#007BFF",
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
        marginHorizontal: 5,
    },
    confirmContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 48,
        width: "100%",
    },
    confirmButton: {
        backgroundColor: "#28A745",
        paddingVertical: 16,
        paddingHorizontal: 48,
        borderRadius: 10,
        minWidth: 220,
        minHeight: 56,
        alignItems: "center",
        justifyContent: "center",
    },
    confirmText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        textAlign: "center",
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        textAlign: "center",
    },
});

export default TimePicker;
