import React from 'react';
import { View, StyleSheet } from 'react-native';
import ErrorDisplay from './ErrorDisplay';
import useErrorHandler from '../../hooks/useErrorHandler';

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

  return (
    <View style={[styles.container, style]}>
      {error && (
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
