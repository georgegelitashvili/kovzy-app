import eventEmitter from './EventEmitter';

export const CONNECTION_EVENTS = {
  ISSUE: 'connectionIssue',
  RESTORED: 'connectionRestored',
  RETRY: 'connectionRetry',
};

const CONNECTIVITY_ERROR_TYPES = new Set([
  'NETWORK_ERROR',
  'NO_INTERNET',
  'REQUEST_TIMEOUT',
  'CONNECTION_REFUSED',
  'SSL_ERROR',
]);

const FAILURE_THRESHOLD = 3;

let consecutiveFailures = 0;
let bannerVisible = false;
let dismissedUntilSuccess = false;

const emitIssue = (payload = {}) => {
  bannerVisible = true;
  eventEmitter.emit(CONNECTION_EVENTS.ISSUE, {
    failureCount: consecutiveFailures,
    ...payload,
  });
};

const emitRestored = () => {
  if (!bannerVisible && consecutiveFailures === 0) return;

  bannerVisible = false;
  dismissedUntilSuccess = false;
  consecutiveFailures = 0;
  eventEmitter.emit(CONNECTION_EVENTS.RESTORED);
};

export const isConnectivityError = (error) => {
  if (!error) return false;

  const type = error.type || error.code;
  if (CONNECTIVITY_ERROR_TYPES.has(type)) return true;

  if (!error.response && (
    error.code === 'ERR_NETWORK' ||
    error.code === 'ECONNABORTED' ||
    /network error/i.test(error.message || '')
  )) {
    return true;
  }

  return false;
};

export const reportConnectionSuccess = () => {
  if (consecutiveFailures > 0 || bannerVisible) {
    emitRestored();
    return;
  }
  consecutiveFailures = 0;
};

export const reportConnectionFailure = (error, options = {}) => {
  if (options.skip || !isConnectivityError(error)) {
    return;
  }

  consecutiveFailures += 1;

  if (dismissedUntilSuccess) {
    return;
  }

  if (consecutiveFailures >= FAILURE_THRESHOLD || options.force) {
    emitIssue({
      type: error?.type || error?.code || 'NETWORK_ERROR',
      message: error?.message,
      url: error?.config?.url || options.url,
    });
  }
};

export const dismissConnectionBanner = () => {
  bannerVisible = false;
  dismissedUntilSuccess = true;
};

export const requestConnectionRetry = () => {
  eventEmitter.emit(CONNECTION_EVENTS.RETRY);
};

export const getConnectionMonitorState = () => ({
  consecutiveFailures,
  bannerVisible,
  dismissedUntilSuccess,
  failureThreshold: FAILURE_THRESHOLD,
});
