import React, { useMemo } from 'react';
import ErrorDisplay from '../components/generate/ErrorDisplay';
import useErrorHandler from '../hooks/useErrorHandler';

export default function useErrorDisplay({ showInline = true, style = {} } = {}) {
  const { error, setError, setApiError, clearError, persistent } = useErrorHandler();

  console.log('[useErrorDisplay] Current error state:', error);
  console.log('[useErrorDisplay] Persistent flag:', persistent);

  const errorDisplay = useMemo(() => {
    if (!showInline || !error?.message) return null;

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
    persistent
  };
}
