import React from 'react';
import { View } from 'react-native';
import ErrorDisplay from '../components/generate/ErrorDisplay';
import useErrorHandler from '../hooks/useErrorHandler';

/**
 * A React Hook for using ErrorDisplay within functional components
 * 
 * @param {Object} options Options for the error handler
 * @param {boolean} options.showInline Whether to return the ErrorDisplay component inline (true) 
 *                                    or just return the error handling methods (false)
 * @param {Object} options.style Additional style for the error display
 * @returns {Object} Error handling methods and optional ErrorDisplay component
 * 
 * @example
 * // With inline display
 * const { errorDisplay, setError } = useErrorDisplay({ showInline: true });
 * // Later in component
 * return (
 *   <View>
 *     {errorDisplay}
 *     <OtherComponents />
 *   </View>
 * );
 * 
 * @example
 * // Without inline display (when using ErrorWrapper or manually rendering ErrorDisplay)
 * const { error, setError, clearError } = useErrorDisplay();
 */
export default function useErrorDisplay({ showInline = true, style = {} } = {}) {
  const errorHandler = useErrorHandler();
  const { error, clearError } = errorHandler;
  
  // Create the ErrorDisplay component if requested
  const errorDisplay = showInline && (
    <ErrorDisplay 
      error={error} 
      onDismiss={clearError} 
      style={style} 
    />
  );
  
  return {
    ...errorHandler,
    errorDisplay
  };
}
