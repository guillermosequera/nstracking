import { parse, isValid, format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import {
  CHILE_TIMEZONE,
  DATE_FORMATS,
  ERROR_MESSAGES,
  DATE_VALIDATION,
  DATE_PARSING_FORMATS
} from './constants';

/**
 * Valida si una fecha es válida según los criterios establecidos
 */
export const isValidDate = (date) => {
  if (!date) return { isValid: false, error: ERROR_MESSAGES.INVALID_DATE };
  
  const dateObj = date instanceof Date ? date : new Date(date);
  if (!isValid(dateObj)) {
    return { isValid: false, error: ERROR_MESSAGES.INVALID_DATE };
  }

  const year = dateObj.getFullYear();
  if (year < DATE_VALIDATION.MIN_YEAR || year > DATE_VALIDATION.MAX_YEAR) {
    return { isValid: false, error: ERROR_MESSAGES.INVALID_DATE };
  }

  return { isValid: true, error: null };
};

/**
 * Convierte una fecha a formato ISO
 */
export const convertToISO = (date) => {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (!isValid(dateObj)) {
      throw new Error(ERROR_MESSAGES.INVALID_DATE);
    }
    return dateObj.toISOString();
  } catch (error) {
    console.error('Error converting to ISO:', error);
    return null;
  }
};

/**
 * Formatea una fecha para visualización
 */
export const formatForDisplay = (date, displayFormat = DATE_FORMATS.DISPLAY_WITH_TIME) => {
  try {
    if (!date) {
      console.error('formatForDisplay: fecha es null o undefined');
      return null;
    }

    let dateObj;
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      // Si la fecha viene como string, intentar parsearla primero
      const parsedDate = parseMultiFormat(date);
      if (!parsedDate) {
        console.error('formatForDisplay: no se pudo parsear la fecha:', date);
        throw new Error(ERROR_MESSAGES.INVALID_DATE);
      }
      dateObj = parsedDate;
    } else {
      dateObj = new Date(date);
    }

    if (!isValid(dateObj)) {
      console.error('formatForDisplay: fecha inválida:', date);
      throw new Error(ERROR_MESSAGES.INVALID_DATE);
    }

    // Validar que la fecha esté dentro del rango permitido
    const year = dateObj.getFullYear();
    if (year < DATE_VALIDATION.MIN_YEAR || year > DATE_VALIDATION.MAX_YEAR) {
      console.warn('formatForDisplay: fecha fuera de rango:', { date, year, min: DATE_VALIDATION.MIN_YEAR, max: DATE_VALIDATION.MAX_YEAR });
      // Aún así intentamos formatear la fecha
    }

    return format(dateObj, displayFormat);
  } catch (error) {
    console.error('Error en formatForDisplay:', { date, error: error.message });
    return null;
  }
};

/**
 * Convierte una fecha a zona horaria de Chile
 */
export const toChileTimezone = (date) => {
  try {
    if (!date) {
      console.error('toChileTimezone: fecha es null o undefined');
      return null;
    }

    const dateObj = date instanceof Date ? date : new Date(date);
    if (!isValid(dateObj)) {
      console.error('toChileTimezone: fecha inválida:', date);
      throw new Error(ERROR_MESSAGES.INVALID_DATE);
    }

    // Validar que la fecha esté dentro del rango permitido
    const year = dateObj.getFullYear();
    if (year < DATE_VALIDATION.MIN_YEAR || year > DATE_VALIDATION.MAX_YEAR) {
      console.error('toChileTimezone: fecha fuera de rango:', { date, year, min: DATE_VALIDATION.MIN_YEAR, max: DATE_VALIDATION.MAX_YEAR });
      // Aún así intentamos convertir la fecha
    }

    return formatInTimeZone(dateObj, CHILE_TIMEZONE, DATE_FORMATS.DISPLAY_WITH_TIME);
  } catch (error) {
    console.error('Error en toChileTimezone:', { date, error: error.message });
    return null;
  }
};

/**
 * Parser flexible que intenta diferentes formatos
 */
export const parseMultiFormat = (dateString) => {
  if (!dateString) return null;

  // Si ya es un objeto Date, validar y retornar
  if (dateString instanceof Date) {
    return isValid(dateString) ? dateString : null;
  }

  // Intentar parse ISO
  try {
    const isoDate = parseISO(dateString);
    if (isValid(isoDate)) return isoDate;
  } catch (error) {
    // Continuar con otros formatos
  }

  // Intentar diferentes formatos
  for (const formatStr of DATE_PARSING_FORMATS) {
    try {
      const parsedDate = parse(dateString, formatStr, new Date());
      if (isValid(parsedDate)) return parsedDate;
    } catch (error) {
      continue;
    }
  }

  return null;
};