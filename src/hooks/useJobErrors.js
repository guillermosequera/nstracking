// src/hooks/useJobErrors.js

import { useState, useCallback } from 'react';

export function useJobErrors() {
  const [error, setError] = useState('');

  const handleError = useCallback((error) => {
    console.error('Job operation error:', error);
    setError(error.message || 'Ha ocurrido un error. Por favor, inténtalo de nuevo.');
  }, []);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  return { error, handleError, clearError };
}