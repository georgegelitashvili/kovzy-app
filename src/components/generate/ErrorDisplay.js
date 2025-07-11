import React, { useContext } from 'react';
import Toast from './Toast'; // path to your Toast component
import { LanguageContext } from '../Language';
import { USER_VISIBLE_ERROR_TYPES, TECHNICAL_ERROR_PATTERNS } from '../../utils/ErrorConstants';

const ErrorDisplay = ({ error, style, onDismiss }) => {
  const { dictionary } = useContext(LanguageContext);

  if (!error) return null;

  if (!USER_VISIBLE_ERROR_TYPES.includes(error.type)) {
    console.log('Suppressing error display for error type:', error.type);
    return null;
  }

  const containsTechnicalDetails = TECHNICAL_ERROR_PATTERNS.some(pattern =>
    pattern.test(error.message || '')
  );

  if (containsTechnicalDetails) {
    console.log('Suppressing error with technical details:', error.message);
    return null;
  }

  const getErrorMessage = (error) => {
    console.log('[ErrorDisplay] Processing error:', error);
    if (error.message) return error.message;

    if (dictionary?.[`errors.${error.type}`]) {
      return dictionary[`errors.${error.type}`];
    }

    return dictionary?.['errors.UNKNOWN'] || 'Something went wrong. Please try again later.';
  };

  const handleDismiss = () => {
    if (onDismiss) onDismiss();
  };
  console.log('[ErrorDisplay] error object:', JSON.stringify(error, null, 2));
  console.log('[ErrorDisplay] persistent flag:', error?.persistent);

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
