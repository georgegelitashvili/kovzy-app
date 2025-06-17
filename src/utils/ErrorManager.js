import eventEmitter from '../utils/EventEmitter';

/**
 * Error management utilities for the application
 */
class ErrorManager {
  /**
   * Shows an error using the ErrorDisplay component
   * @param {string} type The error type (e.g., 'NETWORK_ERROR', 'SERVER_ERROR', etc.)
   * @param {string} message The error message to display
   */
  static showError(type, message) {
    if (global.errorHandler) {
      global.errorHandler.setError(type, message);
    } else {
      // Fallback to toast if global error handler is not available
      eventEmitter.emit('showToast', {
        type: 'failed',
        title: 'Error',
        message: message || 'An error occurred'
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
    if (global.errorHandler) {
      // If it's already a formatted error from our API interceptor
      if (error.type && error.message) {
        global.errorHandler.setApiError(error);
      } else if (error.response?.status === 401) {
        global.errorHandler.setError('UNAUTHORIZED', 'Authentication failed');
      } else if (!error.response && (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error'))) {
        global.errorHandler.setError('NETWORK_ERROR', 'Network connection problem');
      } else if (error.response?.status >= 500) {
        global.errorHandler.setError('SERVER_ERROR', 'Server error. Please try again later.');
      } else {
        global.errorHandler.setError('UNKNOWN', error.message || 'An unexpected error occurred');
      }
    }
  }
}

export default ErrorManager;
