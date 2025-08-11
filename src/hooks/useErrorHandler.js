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

    if (typeof errOrType === "object" && errOrType?.type && errOrType?.message) {
      type = errOrType.type;
      message = errOrType.message;
      persistentFlag = errOrType.persistent === true || options?.persistent === true;
    } else if (typeof errOrType === "object" && maybeMessage === null) {
      const extracted = extractError(errOrType);
      type = extracted.type;
      message = extracted.message;
      persistentFlag = options?.persistent === true;
    } else {
      type = errOrType;
      message = maybeMessage;
      persistentFlag = options?.persistent === true;
    }

    // Suppress NETWORK_ERROR completely: no logs, no state, no UI
    if (type === 'NETWORK_ERROR') {
      return;
    }

    const show = shouldShowError(type, message);
    if (!show) {
      return;
    }

    setErrorState({ type, message, persistent: persistentFlag });
    setPersistent(persistentFlag);
  }, []);

  /**
   * კონკრეტულად API-ს პასუხზე გამზადებული ფუნქცია
   */
  const setApiError = useCallback((apiError) => {
    const { type, message } = extractError(apiError);
    // Suppress NETWORK_ERROR completely
    if (type === 'NETWORK_ERROR') {
      return;
    }
    if (shouldShowError(type, message)) {
      setErrorState({ type, message });
    }
  }, []);

  /**
   * კლავს ერორს
   */
  const clearError = useCallback(() => {
    setErrorState((prev) => {
      if (prev?.persistent) {
        // თუ persistent, არ გაასუფთავო ავტომატურად
        return prev;
      }
      return null;
    });
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
