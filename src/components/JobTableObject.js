import React from 'react';

export default function JobTableObject({ title, jobs, columns }) {
  if (!jobs || jobs.length === 0) {
    return (
      <div>
        <h2 className='text-2xl font-semibold mb-4'>{title}</h2>
        <p className='text-gray-400'>No hay trabajos para mostrar.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      <div className="bg-gray-800 rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-blue-800">
            <tr>
              <th className="px-2 py-3 text-left text-xs font-medium text-green-100 uppercase tracking-wider whitespace-nowrap">#</th>
              {columns.map((column, index) => (
                <th key={index} className="px-2 py-3 text-left text-xs font-medium text-green-100 uppercase tracking-wider whitespace-nowrap">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {jobs.map((job, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-850' : 'bg-gray-800'}>
                <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-300">{index + 1}</td>
                {columns.map((column, cellIndex) => (
                  <td key={cellIndex} className="px-2 py-4 whitespace-nowrap text-sm text-gray-300">
                    {column === 'Fecha y Hora' ? new Date(job[column]).toLocaleString() : job[column]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 