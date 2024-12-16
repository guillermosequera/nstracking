import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

const SpreadsheetLink = ({ href, label }) => {
  const { theme } = useTheme();
  
  return (
    <div className="fixed bottom-4 left-4 z-10">
      <Link 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className={`px-3 py-2 rounded-md text-sm shadow-xl font-medium transition-all duration-200 ${
          theme === 'dark'
            ? "bg-slate-800 hover:bg-blue-800 text-slate-300 hover:text-white"
            : "bg-slate-200 hover:bg-blue-800 text-slate-700 hover:text-white hover:no-underline"
        }`}
      >
        Ver hoja de datos
      </Link>
    </div>
  );
};

export default SpreadsheetLink;