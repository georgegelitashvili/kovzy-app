import eventEmitter from '../utils/EventEmitter';
import { USER_VISIBLE_ERROR_TYPES, TECHNICAL_ERROR_PATTERNS, shouldShowError } from './ErrorConstants';

/**
 * Error management utilities for the application
 */
class ErrorManager {  /**
   * Determines if an error should be shown to a user
   * @param {string} type The error type
   * @param {string} message The error message
   * @returns {boolean} Whether the error should be shown
   */
  static shouldShowError(type, message) {
    // Suppress NETWORK_ERROR completely
    if (type === 'NETWORK_ERROR') {
      return false;
    }
    return shouldShowError(type, message);
  }

  /**
   * Shows an error using the ErrorDisplay component
   * @param {string} type The error type (e.g., 'NETWORK_ERROR', 'SERVER_ERROR', etc.)
   * @param {string} message The error message to display
   */
  static showError(type, message) {
    // Suppress NETWORK_ERROR completely: no logs, no UI
    if (type === 'NETWORK_ERROR') {
      return;
    }
    if (!this.shouldShowError(type, message)) {
      return;
    }
    if (global.errorHandler) {
      global.errorHandler.setError(type, message);
    } else {
      eventEmitter.emit('showToast', {
        type: 'failed',
        title: 'Error',
        subtitle: message
      });
    }
  }

  /**
   * Clear the currently displayed error
   */
  static clearError() {
    if (global.errorHandler) {
      global.errorHandler.clearError();
    }
  }

  /**
   * Handle an API error response
   * @param {Object} error The error object from an API request
   */
  static handleApiError(error) {
    let errorType = 'UNKNOWN';
    let errorMessage = '';

    if (error.type && error.message) {
      errorType = error.type;
      errorMessage = error.message;
    } else if (error.response?.status === 401) {
      errorType = 'UNAUTHORIZED';
      errorMessage = 'Authentication failed';
    } else if (!error.response && (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error'))) {
      errorType = 'NETWORK_ERROR';
      errorMessage = 'Network connection problem';
    } else if (error.response?.status >= 500) {
      errorType = 'SERVER_ERROR';
      errorMessage = 'Server error';
    } else {
      errorMessage = error.message || 'An unexpected error occurred';
    }

    // Suppress NETWORK_ERROR completely: no logs, no UI
    if (errorType === 'NETWORK_ERROR') {
      return;
    }
    if (!this.shouldShowError(errorType, errorMessage)) {
      return;
    }
    if (global.errorHandler) {
      global.errorHandler.setError(errorType, errorMessage);
    }
  }
}

export default ErrorManager;
