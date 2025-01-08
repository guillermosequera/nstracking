export const CHILE_TIMEZONE = 'America/Santiago';

export const DATE_FORMATS = {
  ISO: "yyyy-MM-dd'T'HH:mm:ss'Z'",
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
  DISPLAY_DATE_ONLY: 'dd/MM/yyyy',
  INPUT_WITH_TIME: 'd/M/yyyy HH:mm',
  INPUT_DATE_ONLY: 'd/M/yyyy',
  API_FORMAT: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  BACKEND_FORMAT: 'dd-MM-yyyy'
};

export const ERROR_MESSAGES = {
  INVALID_DATE: 'Fecha inválida',
  INVALID_FORMAT: 'Formato de fecha no soportado',
  CONVERSION_ERROR: 'Error al convertir la fecha',
  TIMEZONE_ERROR: 'Error al convertir zona horaria',
  FUTURE_DATE: 'La fecha no puede ser futura',
  PAST_DATE: 'La fecha no puede ser anterior al año 2000'
};

export const DEFAULT_DISPLAY_FORMAT = DATE_FORMATS.DISPLAY_WITH_TIME;

export const DATE_PARSING_FORMATS = [
  'dd/MM/yyyy HH:mm',           // 18/12/2024 21:00
  'dd/MM/yyyy',                 // 18/12/2024
  'dd-MM-yyyy',                 // 18-12-2024
  "yyyy-MM-dd'T'HH:mm:ss'Z'",  // Formato ISO
  "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", // ISO con milisegundos
  'yyyy-MM-dd',                 // 2024-12-18
  'd/M/yyyy HH:mm',            // 1/1/2024 21:00
  'd/M/yyyy'                   // 1/1/2024
];

export const DATE_VALIDATION = {
  MAX_FUTURE_DAYS: 365,  // 1 año hacia adelante
  MAX_PAST_DAYS: 9125,   // 25 años hacia atrás
  MIN_YEAR: 2000,        // Año mínimo permitido
  MAX_YEAR: 2100         // Año máximo permitido
};