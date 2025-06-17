import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useContext } from 'react';
import { LanguageContext } from '../Language';
import { theme } from '../../core/theme';
import { USER_VISIBLE_ERROR_TYPES, TECHNICAL_ERROR_PATTERNS } from '../../utils/ErrorConstants';
// Using text character instead of MaterialIcons to avoid rendering issues

const ErrorDisplay = ({ error, style, onDismiss }) => {
  const { dictionary } = useContext(LanguageContext);
  
  // Don't render anything if there's no error
  if (!error) return null;

  // Only show errors that are explicitly whitelisted for user visibility
  if (!USER_VISIBLE_ERROR_TYPES.includes(error.type)) {
    console.log('Suppressing error display for error type:', error.type);
    return null; // Don't show the error at all
  }

  // Check if the error message contains technical details that should be hidden
  const containsTechnicalDetails = TECHNICAL_ERROR_PATTERNS.some(pattern => 
    pattern.test(error.message || '')
  );
  
  if (containsTechnicalDetails) {
    console.log('Suppressing error with technical details:', error.message);
    return null; // Don't show errors with technical details
  }

  const getErrorStyle = (errorType) => {
    switch (errorType) {
      case 'NETWORK_ERROR':
        return styles.networkError;
      case 'NOT_FOUND':
        return styles.notFoundError;
      default:
        return styles.defaultError;
    }
  };

  const getErrorMessage = (error) => {
    if (error.message) {
      return error.message;
    }

    if (dictionary && dictionary[`errors.${error.type}`]) {
      return dictionary[`errors.${error.type}`];
    }

    return dictionary?.['errors.UNKNOWN'] || 'Something went wrong. Please try again later.';
  };

  const handleDismiss = () => {
    if (onDismiss) onDismiss();
  };
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.toastContent}>
        <Text style={[styles.text, getErrorStyle(error.type)]}>
          {getErrorMessage(error)}
        </Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1024,
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },  
  text: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },  
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  networkError: {
    color: '#d32f2f',
  },
  notFoundError: {
    color: '#455a64',
  },  defaultError: {
    color: theme.colors?.error || '#F44336',
  },
});

export default ErrorDisplay;