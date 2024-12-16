import React from 'react';
import Link from 'next/link';

const DriveFolderLink = ({ href }) => {
  return (
    <div className="fixed bottom-4 left-40 z-10"> {/* Ajustado el left para posicionarlo junto al SpreadsheetLink */}
      <Link 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="bg-gray-100 hover:bg-green-700 text-gray-800 hover:text-white hover:no-underline px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
      >
        Ver carpeta de archivos
      </Link>
    </div>
  );
};

export default DriveFolderLink;