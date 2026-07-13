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
  if (error?.message) return error.message;

  if (dictionary?.[`errors.${error?.type}`]) {
    return dictionary[`errors.${error.type}`];
  }

  return dictionary?.['errors.UNKNOWN'] || 'Something went wrong. Please try again later.';
}
