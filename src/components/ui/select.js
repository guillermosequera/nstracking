// src/components/ui/select.js
import React from 'react';

export const Select = React.forwardRef(({ 
  options = [],
  value, 
  onValueChange, 
  placeholder, 
  className, 
  ...props 
}, ref) => {
  const baseStyles = "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-100";
  
  return (
    <select
      ref={ref}
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
      {Array.isArray(options) && options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
});

Select.displayName = 'Select';