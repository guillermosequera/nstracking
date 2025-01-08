/**
 * @typedef {Object} DateValidationResult
 * @property {boolean} isValid - Indica si la fecha es válida
 * @property {string|null} error - Mensaje de error si la fecha es inválida
 */

/**
 * @typedef {Object} DateConversionOptions
 * @property {string} [format] - Formato de salida deseado
 * @property {boolean} [toChileTime=true] - Convertir a hora de Chile
 * @property {boolean} [includeTime=true] - Incluir hora en el resultado
 */

/**
 * @typedef {Object} ParsedDate
 * @property {Date} date - Objeto Date parseado
 * @property {string} iso - Fecha en formato ISO
 * @property {string} formatted - Fecha formateada para mostrar
 * @property {string|null} error - Error si hubo alguno
 */

/**
 * @typedef {'ISO'|'DISPLAY_WITH_TIME'|'DISPLAY_DATE_ONLY'|'INPUT_WITH_TIME'|'INPUT_DATE_ONLY'} DateFormat
 */

export {};