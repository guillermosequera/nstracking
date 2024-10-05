import React from 'react';
import SpreadsheetLink from './SpreadsheetLink';

const MultipleSpreadsheetLinks = ({ urls, selectedSheet }) => {
  // Si se proporciona una hoja seleccionada, mostrar solo ese enlace
  if (selectedSheet && urls[selectedSheet]) {
    return (
      <div className="flex justify-center">
        <SpreadsheetLink 
          href={urls[selectedSheet]} 
          label={`Ver hoja de ${selectedSheet}`} 
        />
      </div>
    );
  }

  // Si no se proporciona una hoja seleccionada o no es válida, mostrar todos los enlaces
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {Object.entries(urls).map(([key, url]) => (
        <SpreadsheetLink 
          key={key} 
          href={url} 
          label={`Ver hoja de ${key}`} 
        />
      ))}
    </div>
  );
};

export default MultipleSpreadsheetLinks;