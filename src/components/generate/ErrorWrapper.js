import React from 'react';
import { View, StyleSheet } from 'react-native';
import ErrorDisplay from './ErrorDisplay';
import useErrorHandler from '../../hooks/useErrorHandler';

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
 * A wrapper component that provides error handling capabilities
 * to any component it wraps
 * 
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Child components to render
 * @param {Object} props.style Additional styling for the container
 * @returns {React.ReactElement} The wrapped component with error handling
 */
const ErrorWrapper = ({ children, style }) => {
  const { error, clearError, setError, setApiError } = useErrorHandler();

  // Make error handling methods available to children via context if needed
  const errorHandlingContext = {
    setError,
    setApiError,
    clearError,
  };
  
  // Function to check if an error should be shown
  const shouldShowError = (error) => {
    if (!error) return false;
    
    // Only show whitelisted error types
    if (!USER_VISIBLE_ERROR_TYPES.includes(error.type)) {
      return false;
    }
    
    // Check if the message contains technical details
    if (error.message && TECHNICAL_ERROR_PATTERNS.some(pattern => pattern.test(error.message))) {
      return false;
    }
    
    return true;
  };

  // Only render ErrorDisplay if we have a user-safe error
  const shouldDisplayError = error && shouldShowError(error);

  return (
    <View style={[styles.container, style]}>
      {shouldDisplayError && (
        <ErrorDisplay 
          error={error} 
          onDismiss={clearError} 
          style={styles.errorDisplay} 
        />
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorDisplay: {
    zIndex: 1000,
    width: '92%',
    alignSelf: 'center',
  },
});

export default ErrorWrapper;
