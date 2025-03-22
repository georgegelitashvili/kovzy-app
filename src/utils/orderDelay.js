import axiosInstance from "../apiConfig/apiRequests";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { parseTimeToMinutes, formatDateToLocal, subtractTime, validateDeliveryTime } from './timeUtils';

export const handleDelaySet = async ({
  delay,
  deliveryScheduled,
  scheduled,
  itemId,
  options,
  dictionary,
  onSuccess,
  onError
}) => {
  try {
    console.log('deliveryScheduled:', deliveryScheduled);
    console.log('scheduled:', scheduled);
    console.log('delay:', delay);

    if (!deliveryScheduled || typeof deliveryScheduled !== 'object') {
      console.log('Invalid deliveryScheduled:', deliveryScheduled);
      Alert.alert(dictionary["general.alerts"], "Delivery scheduled time is not set. Please provide a valid time.");
      return false;
    }

    // შევამოწმოთ არის თუ არა დაგეგმილი დრო
    if (!deliveryScheduled.scheduled_delivery && !deliveryScheduled.scheduled_takeaway) {
      console.log('No scheduled delivery or takeaway time');
      Alert.alert(dictionary["general.alerts"], "No scheduled delivery or takeaway time found. Please set a time first.");
      return false;
    }

    // მივიღოთ დაგეგმილი დრო
    let scheduledTime;
    if (deliveryScheduled.scheduled_delivery) {
      scheduledTime = new Date(deliveryScheduled.scheduled_delivery);
    } else if (deliveryScheduled.scheduled_takeaway) {
      // თუ scheduled_takeaway არის true, გამოვიყენოთ მიმდინარე დრო + 30 წუთი
      scheduledTime = new Date();
      scheduledTime.setMinutes(scheduledTime.getMinutes() + 30);
    }
    console.log('scheduledTime:', scheduledTime);
    const currentTime = new Date();

    // შევამოწმოთ არის თუ არა დაგეგმილი დრო მომავალში
    if (isNaN(scheduledTime.getTime())) {
      console.log('Invalid scheduled time');
      Alert.alert(dictionary["general.alerts"], "Invalid scheduled time");
      return false;
    }

    if (scheduledTime <= currentTime) {
      Alert.alert(dictionary["general.alerts"], "Scheduled time has already passed.");
      return false;
    }

    // გამოვიყენოთ delay_time სტანდარტულ დაგვიანებად
    const standardDelay = scheduled.delay_time || "00:30:00";
    console.log('standardDelay:', standardDelay);
    const delayMinutes = parseTimeToMinutes(delay);
    const defaultDelayMinutes = parseTimeToMinutes(standardDelay);

    // გამოვიყენოთ უფრო დიდი დაგვიანება
    const effectiveDelay = delayMinutes > defaultDelayMinutes ? delay : standardDelay;
    console.log('effectiveDelay:', effectiveDelay);

    // გამოვთვალოთ მინიმალური დაგვიანება (დეფაულტ დრო)
    const [defaultHours, defaultMinutes, defaultSeconds] = standardDelay.split(':').map(Number);
    const minReminderTime = subtractTime(scheduledTime, defaultHours, defaultMinutes, defaultSeconds);
    console.log('minReminderTime:', minReminderTime);

    if (!minReminderTime) {
      Alert.alert(dictionary["general.alerts"], "Invalid minimum reminder time calculation");
      return false;
    }

    // გამოვთვალოთ არჩეული დაგვიანება
    const [delayHours, delayMinutesUsed, delaySeconds] = effectiveDelay.split(':').map(Number);
    const selectedReminderTime = subtractTime(scheduledTime, delayHours, delayMinutesUsed, delaySeconds);
    console.log('selectedReminderTime:', selectedReminderTime);

    if (!selectedReminderTime) {
      Alert.alert(dictionary["general.alerts"], "Invalid selected reminder time calculation");
      return false;
    }

    // შევამოწმოთ დროები
    const validation = validateDeliveryTime(selectedReminderTime, scheduledTime);
    console.log('validation:', validation);
    if (!validation.isValid) {
      Alert.alert(dictionary["general.alerts"], validation.message);
      return false;
    }

    // შევამოწმოთ არის თუ არა შეხსენების დრო დეფაულტ დროზე ადრე
    if (selectedReminderTime < minReminderTime) {
      Alert.alert(
        dictionary["general.alerts"],
        `Reminder time cannot be earlier than ${formatDateToLocal(minReminderTime)} (${standardDelay} before delivery)`
      );
      return false;
    }

    const response = await axiosInstance.post(options.url_delayOrders, {
      Orderid: itemId,
      orderDelayTime: formatDateToLocal(selectedReminderTime)
    });

    const data = response.data.data;
    if (data.status === 0) {
      Alert.alert(
        dictionary["general.alerts"],
        `Order reminder set for: ${formatDateToLocal(selectedReminderTime)}`,
        [{ text: dictionary["okay"], onPress: onSuccess }]
      );
    }
    return true;
  } catch (error) {
    console.error("Error delaying order:", error);
    Alert.alert(
      dictionary["general.alerts"],
      "There was a problem setting the reminder. Please try again.",
      [{ text: dictionary["okay"], onPress: onError }]
    );
    return false;
  }
}; 