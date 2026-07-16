import { USER_VISIBLE_ERROR_TYPES, TECHNICAL_ERROR_PATTERNS } from './ErrorConstants';

export function shouldShowErrorToUser(error) {
  if (!error) return false;
  if (!USER_VISIBLE_ERROR_TYPES.includes(error.type)) return false;
  if (TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(error.message || ''))) {
    return false;
  }
  return true;
}

export function getErrorMessage(error, dictionary) {
  const preferLocalizedTypes = [
    'LOGIN_ERROR',
    'VALIDATION_ERROR',
    'UNAUTHORIZED',
    'LOGIN_FAILED',
    'INVALID_CREDENTIALS',
  ];

  if (
    preferLocalizedTypes.includes(error?.type) &&
    dictionary?.[`errors.${error.type}`]
  ) {
    return dictionary[`errors.${error.type}`];
  }

  const rawMessage = error?.message;

  if (typeof rawMessage === 'string' && rawMessage.trim()) {
    return rawMessage;
  }

  if (rawMessage && typeof rawMessage === 'object') {
    const flattened = Object.values(rawMessage)
      .flat()
      .filter((item) => typeof item === 'string' && item.trim())
      .join('\n');
    if (flattened) return flattened;
  }

  if (dictionary?.[`errors.${error?.type}`]) {
    return dictionary[`errors.${error.type}`];
  }

  return dictionary?.['errors.UNKNOWN'] || 'Something went wrong. Please try again later.';
}
