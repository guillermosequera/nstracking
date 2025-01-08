'use client'
// nstracking/src/components/DelayedJobsList.js
import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { useDelayedJobs } from '@/hooks/useDelayedJobs'
import { useDate } from '@/hooks/useDate'
import { DATE_FORMATS } from '@/hooks/useDate/constants'
import { RefreshCw } from 'lucide-react'
import LoadingState from '@/components/LoadingState'
import ErrorState from '@/components/ErrorState'
import EmptyState from '@/components/EmptyState'

const ITEMS_PER_PAGE = 100

export default function DelayedJobsList() {
  const { data: jobs, isLoading, error, refetch } = useDelayedJobs()
  const { parseDate, formatDate, toChileTime, setError } = useDate()
  const [expandedJob, setExpandedJob] = useState(null)
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Memoizar las funciones de procesamiento de fechas
  const processDate = useCallback((dateString) => {
    if (!dateString) return null;
    const result = parseDate(dateString);
    if (result.error) return null;
    return result.date;
  }, [parseDate]);

  // Memoizar la función de formateo de fechas
  const formatDateDisplay = useCallback((dateString, includeTime = true) => {
    if (!dateString) {
      console.log('formatDateDisplay: fecha vacía');
      return 'Fecha no disponible';
    }
    
    console.log('formatDateDisplay - Fecha original:', {
      dateString,
      tipo: typeof dateString,
      includeTime
    });
    
    let dateToFormat = dateString;
    
    // Si la fecha viene en formato ISO, usarla directamente
    if (dateString.includes('T')) {
      const result = parseDate(dateString);
      console.log('formatDateDisplay - Resultado del parsing ISO:', result);
      
      if (result.error) {
        console.log('Error parsing ISO date:', { dateString, error: result.error });
        return 'Fecha inválida';
      }
      
      dateToFormat = result.date;
    }
    // Si la fecha viene en formato DD-MM-YYYY (del backend)
    else if (dateString.includes('-')) {
      const [day, month, year] = dateString.split('-');
      console.log('formatDateDisplay - Partes de la fecha:', { day, month, year });
      if (day && month && year) {
        const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`;
        const result = parseDate(isoDate);
        if (result.error) {
          console.log('Error parsing date with dashes:', { isoDate, error: result.error });
          return 'Fecha inválida';
        }
        dateToFormat = result.date;
      }
    }
    
    // Si la fecha es un string que no coincide con los formatos anteriores
    if (typeof dateToFormat === 'string') {
      const result = parseDate(dateToFormat);
      if (result.error) {
        console.log('Error parsing string date:', { dateToFormat, error: result.error });
        return 'Fecha inválida';
      }
      dateToFormat = result.date;
    }
    
    const chileDate = toChileTime(dateToFormat);
    console.log('formatDateDisplay - Fecha en zona Chile:', chileDate);
    
    if (!chileDate) {
      console.log('Error converting to Chile time:', { dateToFormat });
      return 'Error de zona horaria';
    }
    
    const formatted = formatDate(chileDate, includeTime ? DATE_FORMATS.DISPLAY_WITH_TIME : DATE_FORMATS.DISPLAY_DATE_ONLY);
    console.log('formatDateDisplay - Fecha formateada final:', formatted);
    
    if (!formatted) {
      console.log('Error formatting date:', { chileDate });
      return 'Error de formato';
    }
    
    return formatted;
  }, [parseDate, formatDate, toChileTime]);

  // Memoizar la función de ordenamiento
  const sortByDate = useCallback((a, b) => {
    const dateA = processDate(a.fecha);
    const dateB = processDate(b.fecha);
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateB.getTime() - dateA.getTime();
  }, [processDate]);

  // Memoizar las funciones que usan el ordenamiento
  const getLastStatus = useCallback((historial) => {
    if (!Array.isArray(historial) || historial.length === 0) return '';
    const sortedHistory = [...historial].sort(sortByDate);
    return sortedHistory[0].estado;
  }, [sortByDate]);

  const getSortedHistory = useCallback((historial) => {
    if (!Array.isArray(historial)) return [];
    return [...historial].sort(sortByDate);
  }, [sortByDate]);

  // Memoizar los trabajos mostrados, filtrando solo los atrasados
  const displayedJobs = useMemo(() => {
    if (!jobs || !Array.isArray(jobs)) return [];
    // Filtrar solo trabajos con días de atraso positivos
    const trabajosAtrasados = jobs.filter(job => job.delayDays > 0);
    return trabajosAtrasados.slice(0, displayCount);
  }, [jobs, displayCount]);

  // Memoizar si hay más trabajos
  const hasMore = useMemo(() => {
    if (!jobs || !Array.isArray(jobs)) return false;
    const trabajosAtrasados = jobs.filter(job => job.delayDays > 0);
    return displayCount < trabajosAtrasados.length;
  }, [jobs, displayCount]);

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState error={error} />
  }

  if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
    return <EmptyState />
  }

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      
      const [refreshResult] = await Promise.all([
        refetch(),
        new Promise(resolve => setTimeout(resolve, 1000))
      ]);

      if (!refreshResult?.data) {
        throw new Error('No se recibieron datos en la actualización');
      }

      const newJobs = refreshResult.data;
      
      if (newJobs.length !== jobs?.length) {
        setDisplayCount(ITEMS_PER_PAGE);
      }

      if (expandedJob && !newJobs.some(job => job.id === expandedJob)) {
        setExpandedJob(null);
      }
      
    } catch (error) {
      console.error('Error al actualizar:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE)
  }

  const getJobColor = (delayDays) => {
    if (delayDays === 1) return 'bg-slate-800 border-slate-700'
    if (delayDays === 2) return 'bg-amber-900/60 border-amber-800'
    if (delayDays === 3) return 'bg-orange-900/70 border-orange-800'
    if (delayDays > 3) return 'bg-rose-900/80 border-rose-800'
    return 'bg-slate-800 border-slate-700'
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-blue-600">Trabajos Atrasados</h1>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-slate-300 hover:bg-slate-700 text-blue-600 border-slate-600"
          >
            <RefreshCw 
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin duration-1000' : ''}`}
            />
            <span>{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
          </Button>
        </div>
        <div className="text-sm text-blue-500">
          Mostrando {displayedJobs.length} de {jobs?.length || 0} trabajos
        </div>
      </div>

      <AnimatePresence>
        {displayedJobs.map((job) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={`mb-4 rounded-lg overflow-hidden shadow-lg ${getJobColor(job.delayDays)}`}
          >
            <div 
              className="p-4 cursor-pointer"
              onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
            >
              <div className="flex justify-between items-center text-xl text-gray-100">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{job.number}</span>
                  <Badge variant="secondary" className="bg-rose-900/70 text-yellow-500 border border-rose-800">
                    {job.delayDays} {job.delayDays === 1 ? 'día' : 'días'} de atraso
                  </Badge>
                </div>
                <Badge variant="secondary" className="bg-slate-700 border text-xl text-white border-slate-600">
                  {getLastStatus(job.historial)}
                </Badge>
              </div>
              <div className="text-xs mt-2 flex justify-between text-gray-300">
                <span>Ingreso: {formatDateDisplay(job.entryDate)}</span>
                <span className='bg-slate-700 border border-slate-600 rounded-md px-2 py-1'>
                  Fecha de entrega: {formatDateDisplay(job.dueDate, true)}
                </span>
                <span>Usuario: {job.user}</span>
              </div>
            </div>

            <AnimatePresence>
              {expandedJob === job.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="border-t border-slate-600">
                    <table className="min-w-full divide-y divide-slate-600">
                      <thead className="bg-slate-800/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Fecha y Hora
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Área
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Usuario
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-600">
                        {job.historial && getSortedHistory(job.historial).map((entry, index) => (
                          <tr key={index} className="hover:bg-slate-700/30">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {formatDateDisplay(entry.fecha)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {entry.area}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Badge variant="secondary" className="bg-slate-700 text-gray-200 border border-slate-600">
                                {entry.estado}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {entry.usuario}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>

      {hasMore && (
        <div className="mt-4 text-center">
          <Button
            onClick={handleLoadMore}
            variant="outline"
            className="bg-slate-800 hover:bg-slate-700 text-gray-100 border-slate-600"
          >
            Cargar más trabajos
          </Button>
        </div>
      )}
    </div>
  )
}
