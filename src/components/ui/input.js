// src/components/ui/input.js
import React from 'react';

export const Input = React.forwardRef(({ 
  type = 'text', 
  className = '', 
  ...props 
}, ref) => {
  const baseStyles = "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-100";
  
  return (
    <input
      type={type}
      className={`${baseStyles} ${className}`}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';