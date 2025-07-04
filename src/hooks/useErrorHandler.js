import { useState, useCallback } from 'react';
import { USER_VISIBLE_ERROR_TYPES, TECHNICAL_ERROR_PATTERNS } from '../utils/ErrorConstants';

/**
 * ამოწმებს, უნდა გამოჩნდეს თუ არა ერორი მომხმარებელზე
 */
const shouldShowError = (type, message) => {
  if (!USER_VISIBLE_ERROR_TYPES.includes(type)) {
    return false;
  }

  if (message && TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(message))) {
    return false;
  }

  return true;
};

/**
 * ეცდება ამოიღოს type და message ნებისმიერ ფორმატში მოწოდებული ერორიდან
 */
const extractError = (err, fallbackType = "UNKNOWN") => {
  if (!err) return { type: fallbackType, message: "Unknown error" };

  if (typeof err === "string") return { type: fallbackType, message: err };

  if (err?.type && err?.message) {
    return { type: err.type, message: err.message };
  }

  if (err?.response?.data?.message) {
    return { type: fallbackType, message: err.response.data.message };
  }

  if (err?.message) {
    return { type: fallbackType, message: err.message };
  }

  return { type: fallbackType, message: JSON.stringify(err) };
};

/**
 * Error handler ჰუკი — ამუშავებს ერორების ლოგიკას
 */
export default function useErrorHandler() {
  const [error, setErrorState] = useState(null);
  const [persistent, setPersistent] = useState(false);

  /**
   * გადასცემ ერორს როგორც ობიექტს, ან ტიპად + მესიჯად
   * options.persistent = true თუ გინდა რომ ერორი დარჩეს სანამ არ დააფრისდ
   */
  const setError = useCallback((errOrType, maybeMessage = null, options = {}) => {
    let type, message, persistentFlag;

    // ✅ თუ გადმოცემულია ობიექტი (შეიძლება იყოს error object)
    if (typeof errOrType === "object" && errOrType?.type && errOrType?.message) {
      type = errOrType.type;
      message = errOrType.message;
      persistentFlag = errOrType.persistent === true || options?.persistent === true;
    }
    // ✅ თუ მხოლოდ ერთი არგუმენტია და ობიექტია
    else if (typeof errOrType === "object" && maybeMessage === null) {
      const extracted = extractError(errOrType);
      type = extracted.type;
      message = extracted.message;
      persistentFlag = options?.persistent === true;
    }
    // ✅ სხვა შემთხვევა — ტიპი და მესიჯი ცალკეა
    else {
      type = errOrType;
      message = maybeMessage;
      persistentFlag = options?.persistent === true;
    }

    console.log(`[useErrorHandler] Error triggered: ${type} - ${message}, persistentFlag: ${persistentFlag}`);

    const show = shouldShowError(type, message);
    if (!show) {
      console.log(`[useErrorHandler] Suppressed error: ${type}`);
      return;
    }

    console.log(`[useErrorHandler] Setting error state: ${type} - ${message}, persistent: ${persistentFlag}`);

    setErrorState({ type, message, persistent: persistentFlag });
    setPersistent(persistentFlag);
  }, []);

  /**
   * კონკრეტულად API-ს პასუხზე გამზადებული ფუნქცია
   */
  const setApiError = useCallback((apiError) => {
    const { type, message } = extractError(apiError);
    if (shouldShowError(type, message)) {
      setErrorState({ type, message });
    } else {
      console.log(`[useErrorHandler] Suppressed API error: ${type}`);
    }
  }, []);

  /**
   * კლავს ერორს
   */
  const clearError = useCallback(() => {
    console.log('[useErrorHandler] clearError called');
    setErrorState(null);
    setPersistent(false);
  }, []);

  return {
    error,
    persistent,
    setError,
    setApiError,
    clearError,
  };
}
