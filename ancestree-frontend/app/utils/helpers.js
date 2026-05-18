/**
 * Get initials from first and last name
 * @param {string} firstName - The first name
 * @param {string} lastName - The last name
 * @returns {string} Two-letter initials or 'N/A'
 */
export const getInitials = (firstName, lastName) => {
  if (!firstName && !lastName) return 'N/A';
  return `${firstName ? firstName.charAt(0) : ''}${lastName ? lastName.charAt(0) : ''}`.toUpperCase();
};

/**
 * Extract error message from API response
 * @param {any} error - The error object
 * @param {string} defaultMessage - Fallback message
 * @returns {string} The error message
 */
export const getErrorMessage = (error, defaultMessage = 'An error occurred') => {
  if (!error) return defaultMessage;
  return error.response?.data?.message || error.message || defaultMessage;
};

/**
 * Format error for display in UI
 * @param {any} error - The error object
 * @param {string} defaultMessage - Fallback message
 * @returns {string} User-friendly error message
 */
export const formatErrorMessage = (error, defaultMessage = 'Something went wrong. Please try again.') => {
  if (typeof error === 'string') return error;
  return getErrorMessage(error, defaultMessage);
};
