import React from 'react';
import Link from 'next/link';

const SpreadsheetLink = ({ href, label }) => {
  return (
    <div className="fixed bottom-4 left-4 z-10">
      <Link 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="bg-gray-800 hover:bg-blue-800 text-white-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
      >
        Ver hoja de datos
      </Link>
    </div>
  );
};

export default SpreadsheetLink;