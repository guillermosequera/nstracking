// src/components/ui/alert.js
import React from 'react'

function Alert({ children, variant = 'default', className = '', ...props }) {
  const baseStyles = 'p-4 rounded-md'
  const variantStyles = {
    default: 'bg-blue-100 text-blue-700',
    destructive: 'bg-red-100 text-red-700',
  }

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`} role="alert" {...props}>
      {children}
    </div>
  )
}

export function AlertDescription({ children, className = '', ...props }) {
  return (
    <div className={`text-sm ${className}`} {...props}>
      {children}
    </div>
  )
}

export { Alert, AlertDescription };