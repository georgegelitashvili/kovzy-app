import React, { useEffect, useMemo, useContext, useRef } from 'react';
import ErrorDisplay from '../components/generate/ErrorDisplay';
import useErrorHandler from '../hooks/useErrorHandler';
import { LanguageContext } from '../components/Language';
import eventEmitter from '../utils/EventEmitter';
import { shouldShowErrorToUser, getErrorMessage } from '../utils/errorDisplayUtils';

export default function useErrorDisplay({ showInline = false, style = {} } = {}) {
  const { dictionary } = useContext(LanguageContext);
  const { error, setError, setApiError, clearError, persistent } = useErrorHandler();
  const lastEmittedErrorRef = useRef(null);

  useEffect(() => {
    if (showInline) {
      return;
    }

    if (!error || !shouldShowErrorToUser(error)) {
      if (lastEmittedErrorRef.current) {
        eventEmitter.emit('dismissToast');
        lastEmittedErrorRef.current = null;
      }
      return;
    }

    const errorKey = `${error.type}:${error.message}`;
    if (lastEmittedErrorRef.current === errorKey) {
      return;
    }

    lastEmittedErrorRef.current = errorKey;
    eventEmitter.emit('showToast', {
      type: 'failed',
      title: dictionary?.['errors.TITLE'] || 'Error',
      subtitle: getErrorMessage(error, dictionary),
      duration: error.persistent ? 0 : 5000,
      persistent: !!error.persistent,
    });
  }, [error, showInline, dictionary]);

  const errorDisplay = useMemo(() => {
    if (!showInline || !shouldShowErrorToUser(error)) return null;

    return (
      <ErrorDisplay
        error={error}
        onDismiss={clearError}
        style={style}
      />
    );
  }, [showInline, error, clearError, style]);

  return {
    error,
    setError,
    setApiError,
    clearError,
    errorDisplay,
    persistent,
  };
}
