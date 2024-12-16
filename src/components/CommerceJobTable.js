import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function CommerceJobTable({ 
  title, 
  jobs, 
  columns, 
  timeFrame, 
  enableScroll = false,
  role,
  onError,
  onDelete
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    const container = e.currentTarget;
    setStartX(e.pageX - container.offsetLeft);
    setScrollLeft(container.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const container = e.currentTarget;
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 2;
    container.scrollLeft = scrollLeft - walk;
  };

  if (!jobs || jobs.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        No hay trabajos para mostrar
      </div>
    );
  }

  const renderCell = (job, key) => {
    switch (key) {
      case 'timestamp':
        return new Date(job[key]).toLocaleString();
      case 'deliveryDate':
        return job[key] ? new Date(job[key]).toLocaleDateString() : '-';
      case 'file':
        return job[key] ? (
          <a 
            href={job[key]} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-500 hover:underline"
          >
            Ver archivo
          </a>
        ) : '-';
      default:
        return job[key] || '-';
    }
  };

  const TableContent = (
    <div className="overflow-hidden">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-blue-800">
          <tr>
            {columns.map(({ key, header }) => (
              <th
                key={key}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-green-100 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
            {role && (
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-green-100 uppercase tracking-wider">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-gray-800 divide-y divide-gray-700">
          {jobs.map((job, index) => (
            <tr 
              key={`${job.jobNumber}-${index}`}
              className={index % 2 === 0 ? 'bg-gray-850' : 'bg-gray-800'}
            >
              {columns.map(({ key }) => (
                <td
                  key={key}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-300"
                >
                  {renderCell(job, key)}
                </td>
              ))}
              {role && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  <Button
                    onClick={() => onDelete(job.jobNumber, job.timestamp)}
                    variant="destructive"
                    size="sm"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Eliminar
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return enableScroll ? (
    <div 
      className={`relative w-full overflow-x-auto scrollbar-custom cursor-grab ${isDragging ? 'cursor-grabbing select-none' : ''}`}
      style={{ maxWidth: '100vw' }}
      onWheel={(e) => {
        const container = e.currentTarget;
        if (container.scrollWidth > container.clientWidth) {
          container.scrollLeft += e.deltaY;
        }
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      <div className="inline-block min-w-full">
        {TableContent}
      </div>
    </div>
  ) : TableContent;
}