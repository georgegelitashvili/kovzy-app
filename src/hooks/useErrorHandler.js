import { useState, useCallback } from 'react';

/**
 * A custom hook for handling errors in components
 * @returns {Object} Error handling methods and state
 */
export default function useErrorHandler() {
  const [error, setError] = useState(null);

  /**
   * Set an error with type and message
   * @param {string} type - Error type (e.g., 'NETWORK_ERROR', 'SERVER_ERROR')
   * @param {string} message - Error message
   */
  const setErrorWithType = useCallback((type, message) => {
    setError({ type, message });
  }, []);

  /**
   * Set an error directly from an API error response
   * @param {Object} apiError - The error from API request
   */
  const setApiError = useCallback((apiError) => {
    if (!apiError) return;
    
    // If it's already a formatted error from our API interceptor
    if (apiError.type && apiError.message) {
      setError(apiError);
    } else {
      // If it's a raw error, set a default
      setError({
        type: 'UNKNOWN',
        message: apiError.message || 'An unexpected error occurred'
      });
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
