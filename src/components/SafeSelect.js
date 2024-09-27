import React from 'react';

export const SafeSelect = ({ options = [], value, onValueChange, placeholder, className, ...props }) => {
  const baseStyles = "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-100";
  
  if (!Array.isArray(options) || options.length === 0) {
    return (
      <input
        type="text"
        disabled
        placeholder={placeholder || "No hay opciones disponibles"}
        className={`${baseStyles} ${className}`}
      />
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={`${baseStyles} ${className}`}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};