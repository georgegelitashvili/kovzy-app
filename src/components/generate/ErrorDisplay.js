import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useContext } from 'react';
import { LanguageContext } from '../Language';
import { theme } from '../../core/theme';

const ErrorDisplay = ({ error, style }) => {
  const { dictionary } = useContext(LanguageContext);
  
  if (!error) return null;

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
    if (dictionary && dictionary[`errors.${error.type}`]) {
      return dictionary[`errors.${error.type}`];
    }
    return error.message || dictionary?.['errors.UNKNOWN'];
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.text, getErrorStyle(error.type)]}>
        {getErrorMessage(error)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  networkError: {
    color: '#d32f2f',
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ef9a9a',
  },
  authError: {
    color: '#f57c00',
    backgroundColor: '#fff3e0',
    borderWidth: 1,
    borderColor: '#ffcc80',
  },
  validationError: {
    color: '#c2185b',
    backgroundColor: '#fce4ec',
    borderWidth: 1,
    borderColor: '#f48fb1',
  },
  serverError: {
    color: '#c62828',
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ef9a9a',
  },
  ngrokError: {
    color: '#4527a0',
    backgroundColor: '#ede7f6',
    borderWidth: 1,
    borderColor: '#b39ddb',
  },
  forbiddenError: {
    color: '#d32f2f',
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ef9a9a',
  },
  notFoundError: {
    color: '#455a64',
    backgroundColor: '#eceff1',
    borderWidth: 1,
    borderColor: '#b0bec5',
  },
  defaultError: {
    color: theme.colors.error,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});

export default ErrorDisplay;