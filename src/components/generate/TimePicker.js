import React, { useState, useRef, useEffect, useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { TimerPicker } from "react-native-timer-picker";
import { LanguageContext } from "../Language";

const TimePicker = ({ onDelaySet, onClose, scheduled, showButton, onChange, backgroundColor = "#F1F1F1" }) => {
    const [delayTime, setDelayTime] = useState(0); // Delay in minutes
    const delayTimePickerRef = useRef(null);
    const [isVisibleDelayTimeHours, setIsVisibleDelayTimeHours] = useState(false);
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
        // Assuming delayTime is in minutes (e.g., 90 for 1 hour 30 minutes)
        const hours = Math.floor(delayTime / 60); // Get full hours
        const minutes = delayTime % 60; // Get remaining minutes
        const seconds = 0; // Seconds are assumed to be 0

        // Format the result as H:mm:ss (e.g., 1:30:00)
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };


    useEffect(() => {
        if (delayTimePickerRef.current) {
            delayTimePickerRef.current.setValue({
                hours: Math.floor(delayTime / 60),
                minutes: delayTime % 60,
            });
        }
    }, [delayTime]);

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <View style={styles.pickerContainer}>
                <TimerPicker
                    ref={delayTimePickerRef}
                    onDurationChange={handleDurationChange}
                    padWithNItems={1}
                    hideSeconds={true}
                    hideHours={!isVisibleDelayTimeHours}
                    initialValue={0}
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
            {showButton ? <View style={styles.confirmContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                    <Text style={styles.confirmText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={() => onDelaySet(formatDelayTime())}>
                    <Text style={styles.confirmText}>Confirm</Text>
                </TouchableOpacity>
            </View> : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#fff",
        borderRadius: 10,
        // elevation: 5,
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
        justifyContent: "space-between",
        marginTop: 30,
    },
    cancelButton: {
        backgroundColor: "#DC3545",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginHorizontal: 10,
    },
    confirmButton: {
        backgroundColor: "#28A745",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginHorizontal: 10,
    },
    confirmText: {
        color: "#fff",
        fontSize: 16,
        textAlign: "center",
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        textAlign: "center",
    },
});

export default TimePicker;
