// src/components/JobNumberInput.js
import React, { useState, useCallback, useRef, useEffect } from 'react';
import StatusSelector from './StatusSelector';

const JobNumberInput = ({ 
  jobNumber, 
  setJobNumber, 
  isLoading, 
  onSubmit,
  hideStatusSelector = false
}) => {
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitTimeoutRef = useRef(null); // Para manejar el timeout

  const submitJob = useCallback(async (value) => {
    if (isSubmitting) return;
    
    if (hideStatusSelector || selectedStatus) {
      setIsSubmitting(true);
      try {
        await onSubmit(value, hideStatusSelector ? null : selectedStatus);
        setJobNumber('');
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [hideStatusSelector, selectedStatus, onSubmit, setJobNumber, isSubmitting]);

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setJobNumber(value);
    
    // Limpiar timeout anterior si existe
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }
    
    if (value.length === 8 || value.length === 10) {
      // Guardar referencia al nuevo timeout
      submitTimeoutRef.current = setTimeout(() => {
        submitJob(value);
      }, 800);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Limpiar cualquier timeout pendiente
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }
    
    if (!isSubmitting && (jobNumber.length === 8 || jobNumber.length === 10)) {
      submitJob(jobNumber);
    }
  };

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  const handleStatusSelect = (status) => {
    setSelectedStatus(status);
  };

  return (
    <div className="space-y-6">
      {!hideStatusSelector && (
        <StatusSelector onStatusSelect={handleStatusSelect} />
      )}
      
      <form onSubmit={handleSubmit} className="flex justify-center">
        <div className="flex items-center w-full max-w-md shadow-md">
          <input
            type="text"
            value={jobNumber}
            onChange={handleInputChange}
            placeholder="Número de trabajo (8 o 10 dígitos)"
            className="flex-grow border rounded-l p-2 focus:outline-none focus:ring-2 focus:ring-blue-500
              bg-white border-slate-300 text-slate-900"
            aria-label="Ingrese número de trabajo"
            autoFocus
          />
          <button 
            type="submit" 
            className="px-4 py-2 rounded-r text-white transition duration-200
              bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400"
            disabled={isLoading || isSubmitting || (jobNumber.length !== 8 && jobNumber.length !== 10) || (!hideStatusSelector && !selectedStatus)}
          >
            {isLoading || isSubmitting ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobNumberInput;