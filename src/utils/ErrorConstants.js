/**
 * ErrorConstants.js - Shared error constants for the application
 * 
 * This file centralizes error-related constants to ensure consistency
 * across different parts of the application, including error types,
 * patterns for filtering technical errors, etc.
 */

// ONLY these errors should be shown to users - any other error types will be completely ignored
export const USER_VISIBLE_ERROR_TYPES = [
  'NETWORK_ERROR',     // Only show network connectivity issues
  'NOT_FOUND',          // Only show when requested data is not found
  'LOGIN_ERROR',        // Show login errors to users
  'VALIDATION_ERROR',   // Only show validation errors
  'BRANCH_TEMPORARILY_CLOSED', // Only show when branch is temporarily closed
  'SESSION_EXPIRED',    // Show when session expires
];

// Regex patterns to detect technical errors that should never be shown to users
export const TECHNICAL_ERROR_PATTERNS = [
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
  /type error/i,
  /has been rejected/i,    // Catch rejected promises
  /update/i                // Catch update-related errors
];

/**
 * Determines if an error should be shown to a user based on type and message
 * 
 * @param {string} type The error type
 * @param {string} message The error message
 * @returns {boolean} Whether the error should be shown
 */
export const shouldShowError = (type, message) => {
  // Only show whitelisted error types
  if (!USER_VISIBLE_ERROR_TYPES.includes(type)) {
    return false;
  }
  
  // Check if the message contains technical details
  if (message && TECHNICAL_ERROR_PATTERNS.some(pattern => pattern.test(message))) {
    return false;
  }
  
  return true;
};
