'use client'
// nstracking/src/components/DelayedJobsList.js
import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import useSWR from 'swr'
import { fetchDelayedJobs } from '@/utils/jobUtils'
import { useDate } from '@/hooks/useDate'
import { DATE_FORMATS } from '@/hooks/useDate/constants'
import { RefreshCw } from 'lucide-react'
import LoadingState from '@/components/LoadingState'
import ErrorState from '@/components/ErrorState'
import EmptyState from '@/components/EmptyState'

const ITEMS_PER_PAGE = 100

// Función para determinar el color según días de atraso
const getJobColor = (delayDays) => {
  if (delayDays > 10) return 'bg-rose-900/90'
  if (delayDays > 6) return 'bg-rose-800/90'
  if (delayDays > 2) return 'bg-rose-700/90'
  if (delayDays === 2) return 'bg-rose-600/90'
  return 'bg-rose-500/90'
}

export default function DelayedJobsList() {
  const { data: response, error, mutate } = useSWR('/api/delayed-jobs', fetchDelayedJobs, {
    refreshInterval: 30000, // Refrescar cada 30 segundos
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000
  });

  const jobs = response?.data || [];
  const isLoading = !response && !error;

  const { parseDate, formatDate, toChileTime } = useDate()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [expandedJob, setExpandedJob] = useState(null)
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)

  // Memoizar el ordenamiento por fecha usando parseDate
  const sortByDate = useMemo(() => {
    return (a, b) => {
      const dateA = parseDate(a.fecha)?.date
      const dateB = parseDate(b.fecha)?.date
      if (!dateA && !dateB) return 0
      if (!dateA) return 1
      if (!dateB) return -1
      return dateB.getTime() - dateA.getTime()
    }
  }, [parseDate])

  // Funciones que usan el ordenamiento
  const getLastStatus = useMemo(() => {
    return (historial) => {
      if (!Array.isArray(historial) || historial.length === 0) return ''
      const sortedHistory = [...historial].sort(sortByDate)
      return sortedHistory[0].estado
    }
  }, [sortByDate])

  const getSortedHistory = useMemo(() => {
    return (historial) => {
      if (!Array.isArray(historial)) return []
      return [...historial].sort(sortByDate)
    }
  }, [sortByDate])

  // Memoizar los trabajos mostrados para evitar recálculos
  const displayedJobs = useMemo(() => {
    if (!jobs || !Array.isArray(jobs)) return [];
    const trabajosAtrasados = jobs.filter(job => job.delayDays > 0);
    return trabajosAtrasados.slice(0, displayCount);
  }, [jobs, displayCount]);

  // Memoizar si hay más trabajos
  const hasMore = useMemo(() => {
    if (!jobs || !Array.isArray(jobs)) return false;
    const trabajosAtrasados = jobs.filter(job => job.delayDays > 0);
    return displayCount < trabajosAtrasados.length;
  }, [jobs, displayCount]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    console.log('🔄 Iniciando actualización de trabajos atrasados...');
    
    try {
      const refreshedData = await mutate();
      
      if (refreshedData) {
        console.log('✅ Datos actualizados:', {
          totalTrabajos: Array.isArray(refreshedData.data) ? refreshedData.data.length : 0,
          timestamp: new Date().toISOString()
        });

        // Solo resetear estados si cambia la cantidad de trabajos
        if (refreshedData.data?.length !== jobs?.length) {
          setDisplayCount(ITEMS_PER_PAGE);
          setExpandedJob(null);
        }
      }
    } catch (error) {
      console.error('❌ Error durante la actualización:', error);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  }, [isRefreshing, mutate, jobs?.length]);

  // Memoizar el handler para cargar más
  const handleLoadMore = useCallback(() => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE);
  }, []);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!jobs || !Array.isArray(jobs) || jobs.length === 0) return <EmptyState />;

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
                <span>Ingreso: {formatDate(toChileTime(job.entryDate))}</span>
                <span className='bg-slate-700 border border-slate-600 rounded-md px-2 py-1'>
                  Fecha de entrega: {formatDate(toChileTime(job.dueDate))}
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
                              {formatDate(toChileTime(entry.fecha))}
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
