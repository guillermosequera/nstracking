import React, { useState, useCallback, useMemo } from 'react';
import { onDelete } from '@/utils/jobUtils';
import { useSession } from "next-auth/react";
import { getUserRole } from '@/config/roles';
import { Button } from '@/components/ui/Button';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import DeleteButton from '@/components/DeleteButton';

const TIME_FRAME_LABELS = {
  'today': 'Hoy',
  'yesterday': 'Ayer',
  'twoDaysAgo': 'Antes de Ayer',
  'week': 'Esta Semana',
  'month': 'Este Mes',
  'lastMonth': 'Mes Anterior',
  'all': 'Todos'
}

export default function JobTable({ 
  title, 
  jobs, 
  columns, 
  timeFrame, 
  enableScroll = false,
  role = '',
  onError,
  onRefresh,
  isLoading
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const sortedJobs = useMemo(() => {
    if (!jobs) return [];
    
    return [...jobs].sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateB - dateA;
    });
  }, [jobs]);

  const handleDelete = useCallback(async (jobNumber, timestamp) => {
    if (!window.confirm(`¿Estás seguro de eliminar el trabajo N° ${jobNumber}?`)) {
      return;
    }

    try {
      const userEmail = session?.user?.email;
      
      await onDelete(jobNumber, timestamp, role, userEmail);
      
      switch (role) {
        case 'workerDispatch':
          queryClient.invalidateQueries(['dispatch-jobs']);
          break;
        case 'workerQuality':
          queryClient.invalidateQueries(['quality-jobs']);
          break;
        case 'workerCommerce':
          queryClient.invalidateQueries(['commerce-jobs']);
          break;
        default:
          queryClient.invalidateQueries([`${role}-jobs`]);
      }
    } catch (error) {
      onError(error);
    }
  }, [role, queryClient, onError, session]);

  const handleMouseDown = (e) => {
    setIsDragging(true)
    const container = e.currentTarget
    setStartX(e.pageX - container.offsetLeft)
    setScrollLeft(container.scrollLeft)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    e.preventDefault()
    const container = e.currentTarget
    const x = e.pageX - container.offsetLeft
    const walk = (x - startX) * 2
    container.scrollLeft = scrollLeft - walk
  }

  const RefreshButton = useMemo(() => (
    <Button
      onClick={onRefresh}
      variant="outline"
      size="sm"
      disabled={isLoading}
      className="ml-2 flex items-center gap-2 shadow-xl"
    >
      <RefreshCw 
        className={`h-4 w-4 transition-transform duration-700 ease-in-out ${
          isLoading ? 'animate-spin' : ''
        }`}
      />
      <span>{isLoading ? 'Actualizando...' : 'Actualizar'}</span>
    </Button>
  ), [isLoading, onRefresh]);

  const TableContent = (
    <div className="overflow-hidden shadow-xl">
      <div className="flex justify-between items-center mb-4 px-6">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {onRefresh && RefreshButton}
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-slate-500">
          <tr>
            {columns.map(({ key, header }) => (
              <th
                key={key}
                scope="col"
                className="px-6 py-3 text-left text-xs font-bold text-slate-900 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
            {role && (
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedJobs.map((job, index) => (
            <tr key={`${job.jobNumber}-${index}`}>
              {columns.map(({ key }) => (
                <td
                  key={key}
                  className="px-6 py-4 whitespace-nowrap text-sm text-slate-900"
                >
                  {key === 'timestamp' ? job.timestampFormatted : job[key] || '-'}
                </td>
              ))}
              {role && (
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                  <DeleteButton
                    onDelete={() => handleDelete(job.jobNumber, job.timestamp)}
                    itemId={job.jobNumber}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (!jobs || jobs.length === 0) {
    return (
      <div className="p-4 text-center text-slate-500">
        No hay trabajos para mostrar
      </div>
    );
  }

  return enableScroll ? (
    <div 
      className={`relative w-full overflow-x-auto scrollbar-custom cursor-grab ${isDragging ? 'cursor-grabbing select-none' : ''}`}
      style={{ maxWidth: '100vw' }}
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