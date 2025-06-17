import { useState, useCallback } from 'react';

// ONLY these errors should be shown to users - all others will be hidden
const USER_VISIBLE_ERROR_TYPES = [
  'NETWORK_ERROR',     // Only show network connectivity issues
  'NOT_FOUND'          // Only show when requested data is not found
];

// Regex patterns to detect technical errors that should never be shown to users
const TECHNICAL_ERROR_PATTERNS = [
  /failed to load/i,
  /music/i,
  /audio/i,
  /sound/i,
  /cannot read/i,
  /undefined/i,
  /null/i,
  /function/i,
  /error code/i,
  /exception/i,
  /stack/i,
  /syntax/i,
  /reference/i,
  /type error/i
];

/**
 * Function to check if an error should be shown to users
 * @param {string} type Error type
 * @param {string} message Error message
 * @returns {boolean} Whether the error should be shown
 */
const shouldShowError = (type, message) => {
  // Only allow specific error types
  if (!USER_VISIBLE_ERROR_TYPES.includes(type)) {
    return false;
  }
  
  // Check if message contains technical details
  if (message && TECHNICAL_ERROR_PATTERNS.some(pattern => pattern.test(message))) {
    return false;
  }
  
  return true;
};

/**
 * A custom hook for handling errors in components
 * @returns {Object} Error handling methods and state
 */
export default function useErrorHandler() {
  const [error, setError] = useState(null);

  /**
   * Set an error with type and message, but only if it's a user-visible error
   * @param {string} type - Error type (e.g., 'NETWORK_ERROR', 'SERVER_ERROR')
   * @param {string} message - Error message
   */
  const setErrorWithType = useCallback((type, message) => {
    // Log all errors for debugging
    console.log(`[useErrorHandler] Error triggered: ${type} - ${message}`);
    
    // Only set errors that should be shown to users
    if (shouldShowError(type, message)) {
      setError({ type, message });
    } else {
      console.log(`[useErrorHandler] Suppressed error: ${type}`);
      // Don't update state for technical errors
    }
  }, []);

  /**
   * Set an error directly from an API error response
   * @param {Object} apiError - The error from API request
   */
  const setApiError = useCallback((apiError) => {
    if (!apiError) return;
    
    // If it's already a formatted error from our API interceptor
    if (apiError.type && apiError.message) {
      // Only set the error if it should be shown to users
      if (shouldShowError(apiError.type, apiError.message)) {
        setError(apiError);
      } else {
        console.log(`[useErrorHandler] Suppressed API error: ${apiError.type}`);
      }
    } else {
      // Don't show raw errors at all - they're always technical
      console.log('[useErrorHandler] Suppressed raw API error');
    }
  }, []);

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    setError: setErrorWithType,
    setApiError,
    clearError
  };
}
