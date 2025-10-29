import React, { useContext } from 'react';
import Toast from './Toast'; // path to your Toast component
import { LanguageContext } from '../Language';
import { USER_VISIBLE_ERROR_TYPES, TECHNICAL_ERROR_PATTERNS } from '../../utils/ErrorConstants';

const ErrorDisplay = ({ error, style, onDismiss }) => {
  // ALWAYS call ALL hooks at the top level - NEVER conditionally
  const { dictionary } = useContext(LanguageContext);

  // Check all conditions but don't return early
  const hasError = !!error;
  const isNetworkError = error?.type === 'NETWORK_ERROR';
  const isUserVisibleError = error ? USER_VISIBLE_ERROR_TYPES.includes(error.type) : false;
  const containsTechnicalDetails = error ? TECHNICAL_ERROR_PATTERNS.some(pattern =>
    pattern.test(error.message || '')
  ) : false;

  // Determine if we should hide the error display
  const shouldHide = !hasError || isNetworkError || !isUserVisibleError || containsTechnicalDetails;

  const getErrorMessage = (error) => {
    if (error?.message) return error.message;

    if (dictionary?.[`errors.${error?.type}`]) {
      return dictionary[`errors.${error?.type}`];
    }

    return dictionary?.['errors.UNKNOWN'] || 'Something went wrong. Please try again later.';
  };

  const handleDismiss = () => {
    if (onDismiss) onDismiss();
  };

  console.log('[ErrorDisplay] error object:', JSON.stringify(error, null, 2));
  console.log('[ErrorDisplay] persistent flag:', error?.persistent);

  // Return null only after all hooks have been called
  if (shouldHide) {
    return null;
  }

  return (
    <Toast
      type="failed"
      title={dictionary?.['errors.TITLE'] || "Error"}
      subtitle={getErrorMessage(error)}
      animate={true}
      persistent={!!error?.persistent}
      onDismiss={() => {
        if (!error?.persistent) {
          handleDismiss();
        }
      }}
      addStyles={style}
    />
  );
};

export default ErrorDisplay;
