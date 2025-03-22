import axiosInstance from "../apiConfig/apiRequests";
import { Alert } from "react-native";

export const parseTimeToMinutes = (time) => {
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return hours * 60 + minutes + seconds / 60;
};

export const formatDateToLocal = (date) => {
  if (!(date instanceof Date) || isNaN(date)) return "Invalid Date";
  const pad = (num) => num.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const subtractTime = (baseTime, hours = 0, minutes = 0, seconds = 0) => {
  const time = new Date(baseTime);
  if (isNaN(time)) return "Invalid base time";
  time.setHours(time.getHours() - hours);
  time.setMinutes(time.getMinutes() - minutes);
  time.setSeconds(time.getSeconds() - seconds);
  return time;
};

export const handleDelaySet = ({
  delay,
  deliveryScheduled,
  scheduled,
  itemId,
  options,
  dictionary,
  setLoadingOptions,
  setPostponeOrder,
  setPickerVisible,
  setLoading
}) => {
  setLoadingOptions(false);
  if (!deliveryScheduled) {
    alert("Delivery scheduled time is not set. Please provide a valid time.");
    return false;
  }

  const deliveryScheduledTime = new Date(deliveryScheduled.replace(' ', 'T'));
  if (isNaN(deliveryScheduledTime)) {
    alert("Invalid delivery scheduled time format.");
    return false;
  }

  const delayMinutes = parseTimeToMinutes(delay);
  const defaultDelayMinutes = parseTimeToMinutes(scheduled.delay_time);
  const effectiveDelay = delayMinutes < defaultDelayMinutes ? scheduled.delay_time : delay;
  console.log("Effective Delay:", effectiveDelay);

  const [delayHours, delayMinutesUsed, delaySeconds] = effectiveDelay.split(':').map(Number);
  const adjustedTime = subtractTime(deliveryScheduledTime, delayHours, delayMinutesUsed, delaySeconds);

  if (isNaN(adjustedTime)) {
    console.error("Invalid adjusted time:", adjustedTime);
    return false;
  }

  const adjustedTimeStamp = adjustedTime.getTime();
  const deliveryScheduledStamp = deliveryScheduledTime.getTime();
  const currentTimeStamp = new Date().getTime();

  if (adjustedTimeStamp < currentTimeStamp) {
    alert("The adjusted delivery time is in the past. Please select a valid time.");
    return false;
  }

  if (adjustedTimeStamp >= deliveryScheduledStamp) {
    alert("The adjusted delivery time is later than the scheduled time. The order cannot be delayed.");
    return false;
  }

  try {
    setPostponeOrder(true);
    axiosInstance
      .post(options.url_delayOrders, {
        Orderid: itemId,
        orderDelayTime: formatDateToLocal(adjustedTime)
      })
      .then((resp) => {
        return resp.data.data
      })
      .then((data) => {
        setPostponeOrder(false);
        if (data.status === 0) {
          Alert.alert(
            dictionary["general.alerts"],
            `Order delay till: ${formatDateToLocal(adjustedTime)}`,
            [
              {
                text: dictionary["okay"],
                onPress: () => setPickerVisible(false),
              },
            ]
          );
        }
        setLoading(false);
      });
  } catch (error) {
    console.error("Error delaying order:", error);
    Alert.alert("Error", "There was a problem delaying the order. Please try again.");
  }
}; 