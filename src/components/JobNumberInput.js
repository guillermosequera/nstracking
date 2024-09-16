// src/components/JobNumberInput.js
import React from 'react';

const JobNumberInput = ({ jobNumber, setJobNumber, isLoading, onSubmit }) => {
  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setJobNumber(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (jobNumber.length === 8 || jobNumber.length === 10) {
      onSubmit(jobNumber);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex justify-center">
      <div className="flex items-center w-full max-w-md">
        <input
          type="text"
          value={jobNumber}
          onChange={handleInputChange}
          placeholder="Número de trabajo (8 o 10 dígitos)"
          className="flex-grow bg-gray-800 border border-gray-700 rounded-l p-2 focus:outline-none focus:ring-2 focus:ring-blue-800 text-gray-100"
          aria-label="Ingrese número de trabajo"
        />
        <button 
          type="submit" 
          className="bg-blue-800 text-white px-4 py-2 rounded-r hover:bg-blue-800 transition duration-200 disabled:bg-gray-600"
          disabled={isLoading || (jobNumber.length !== 8 && jobNumber.length !== 10)}
        >
          {isLoading ? 'Agregando...' : 'Agregar'}
        </button>
      </div>
    </form>
  );
};

export default JobNumberInput;