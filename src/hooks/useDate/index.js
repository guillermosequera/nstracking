import { useState, useCallback } from 'react';
import { DATE_FORMATS, ERROR_MESSAGES } from './constants';
import {
  isValidDate,
  convertToISO,
  formatForDisplay,
  toChileTimezone,
  parseMultiFormat
} from './utils';

export const useDate = () => {
  const [lastError, setLastError] = useState(null);

  const parseDate = useCallback((dateString) => {
    try {
      const parsedDate = parseMultiFormat(dateString);
      if (!parsedDate) {
        return {
          date: null,
          iso: null,
          formatted: null,
          error: ERROR_MESSAGES.INVALID_FORMAT
        };
      }

      const validation = isValidDate(parsedDate);
      if (!validation.isValid) {
        return {
          date: null,
          iso: null,
          formatted: null,
          error: validation.error
        };
      }

      return {
        date: parsedDate,
        iso: convertToISO(parsedDate),
        formatted: formatForDisplay(parsedDate),
        error: null
      };
    } catch (error) {
      return {
        date: null,
        iso: null,
        formatted: null,
        error: error.message
      };
    }
  }, []);

  const formatDate = useCallback((date, format = DATE_FORMATS.DISPLAY_WITH_TIME) => {
    try {
      return formatForDisplay(date, format) || null;
    } catch (error) {
      return null;
    }
  }, []);

  const validateDate = useCallback((date) => {
    return isValidDate(date);
  }, []);

  const toChileTime = useCallback((date) => {
    try {
      return toChileTimezone(date);
    } catch (error) {
      return null;
    }
  }, []);

  const setError = useCallback((error) => {
    setLastError(error);
  }, []);

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  return {
    parseDate,
    formatDate,
    validateDate,
    toChileTime,
    lastError,
    setError,
    clearError
  };
};

export default useDate;