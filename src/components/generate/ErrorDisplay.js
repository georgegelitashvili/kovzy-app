import React, { useContext } from 'react';
import Toast from './Toast';
import { LanguageContext } from '../Language';
import { shouldShowErrorToUser, getErrorMessage } from '../../utils/errorDisplayUtils';

const ErrorDisplay = ({ error, style, onDismiss }) => {
  const { dictionary } = useContext(LanguageContext);

  const handleDismiss = () => {
    if (onDismiss) onDismiss();
  };

  if (!shouldShowErrorToUser(error)) {
    return null;
  }

  return (
    <Toast
      type="failed"
      title={dictionary?.['errors.TITLE'] || "Error"}
      subtitle={getErrorMessage(error, dictionary)}
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
