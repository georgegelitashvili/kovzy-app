import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useContext } from 'react';
import { LanguageContext } from '../Language';
import { theme } from '../../core/theme';
// Using text character instead of MaterialIcons to avoid rendering issues

const IMPORTANT_ERROR_TYPES = [
  'NETWORK_ERROR',
  'SERVER_ERROR',
  'SERVICE_UNAVAILABLE',
  'FORBIDDEN'
];

const ErrorDisplay = ({ error, style, onDismiss }) => {
  const { dictionary } = useContext(LanguageContext);
  
  // Don't render anything if there's no error or it's not important
  if (!error) return null;
  if (error.type && !IMPORTANT_ERROR_TYPES.includes(error.type)) return null;

  const getErrorStyle = (errorType) => {
    switch (errorType) {
      case 'NETWORK_ERROR':
        return styles.networkError;
      case 'UNAUTHORIZED':
        return styles.authError;
      case 'VALIDATION_ERROR':
        return styles.validationError;
      case 'SERVER_ERROR':
      case 'SERVICE_UNAVAILABLE':
        return styles.serverError;
      case 'NGROK_ERROR':
        return styles.ngrokError;
      case 'FORBIDDEN':
        return styles.forbiddenError;
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

    return dictionary?.['errors.UNKNOWN'] || 'An error occurred';
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
  },  text: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },  closeButton: {
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
  authError: {
    color: '#f57c00',
  },
  validationError: {
    color: '#c2185b',
  },
  serverError: {
    color: '#c62828',
  },
  ngrokError: {
    color: '#4527a0',
  },
  forbiddenError: {
    color: '#d32f2f',
  },
  notFoundError: {
    color: '#455a64',
  },
  defaultError: {
    color: theme.colors?.error || '#F44336',
  },
});

export default ErrorDisplay;