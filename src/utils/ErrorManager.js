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
    return shouldShowError(type, message);
  }

  /**
   * Shows an error using the ErrorDisplay component
   * @param {string} type The error type (e.g., 'NETWORK_ERROR', 'SERVER_ERROR', etc.)
   * @param {string} message The error message to display
   */
  static showError(type, message) {
    // Always log all errors for debugging purposes
    console.log(`[ErrorManager] Error occurred: ${type} - ${message}`);
    
    // Check if this error type should be shown to users
    if (!this.shouldShowError(type, message)) {
      console.log(`[ErrorManager] Suppressing error display for: ${type}`);
      return; // Don't show anything to the user
    }
    
    // For user-safe errors, proceed with displaying them
    if (global.errorHandler) {
      global.errorHandler.setError(type, message);
    } else {      // Fallback to toast if global error handler is not available
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
    // Always log the full technical error for developers
    console.error('[ErrorManager] API Error Details:', error);
    
    let errorType = 'UNKNOWN';
    let errorMessage = '';
    
    // Extract error details
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
    
    // Check if this error should be shown to users
    if (!this.shouldShowError(errorType, errorMessage)) {
      console.log(`[ErrorManager] Suppressing API error display for: ${errorType}`);
      return; // Don't show anything to the user
    }
    
    // For user-safe errors, proceed with displaying them
    if (global.errorHandler) {
      global.errorHandler.setError(errorType, errorMessage);
    }
  }
}

export default ErrorManager;
