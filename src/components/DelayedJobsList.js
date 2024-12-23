'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { useDelayedJobs } from '@/hooks/useDelayedJobs'
import { RefreshCw } from 'lucide-react'
import LoadingState from '@/components/LoadingState'
import ErrorState from '@/components/ErrorState'
import EmptyState from '@/components/EmptyState'

const ITEMS_PER_PAGE = 100

// Función para procesar fechas de manera consistente
function procesarFecha(fechaOriginal, numeroTrabajo) {
  if (!fechaOriginal) {
    console.log(`Trabajo ${numeroTrabajo}: Fecha vacía o nula`);
    return null;
  }

  // Asegurarnos de que la fecha se interprete como UTC
  const fechaParsed = new Date(fechaOriginal);
  const fechaUTC = new Date(Date.UTC(
    fechaParsed.getUTCFullYear(),
    fechaParsed.getUTCMonth(),
    fechaParsed.getUTCDate(),
    fechaParsed.getUTCHours(),
    fechaParsed.getUTCMinutes(),
    fechaParsed.getUTCSeconds()
  ));
  
  if (!isNaN(fechaUTC.getTime())) {
    return {
      fechaParaProcesar: fechaUTC,
      fechaParaMostrar: fechaUTC.toISOString(),
      fechaFormateada: `${String(fechaUTC.getUTCDate()).padStart(2, '0')}-${String(fechaUTC.getUTCMonth() + 1).padStart(2, '0')}-${fechaUTC.getUTCFullYear()}`,
      fechaConHora: `${String(fechaUTC.getUTCDate()).padStart(2, '0')}-${String(fechaUTC.getUTCMonth() + 1).padStart(2, '0')}-${fechaUTC.getUTCFullYear()} ${String(fechaUTC.getUTCHours()).padStart(2, '0')}:${String(fechaUTC.getUTCMinutes()).padStart(2, '0')}`
    };
  }
  
  console.log(`Trabajo ${numeroTrabajo}: Fecha inválida:`, fechaOriginal);
  return null;
}

export default function DelayedJobsList() {
  const { data: jobs, isLoading, error, refetch } = useDelayedJobs()
  const [expandedJob, setExpandedJob] = useState(null)
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true)
      await refetch()
    } catch (error) {
      console.error('Error al actualizar:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const getJobColor = (delayDays) => {
    if (delayDays === 1) return 'bg-slate-800 border-slate-700'
    if (delayDays === 2) return 'bg-amber-900/60 border-amber-800'
    if (delayDays === 3) return 'bg-orange-900/70 border-orange-800'
    if (delayDays > 3) return 'bg-rose-900/80 border-rose-800'
    return 'bg-slate-800 border-slate-700'
  }

  const formatDate = (dateString, includeTime = true) => {
    if (!dateString) return 'Fecha no disponible';
    
    const fechaProcesada = procesarFecha(dateString);
    if (!fechaProcesada) return 'Fecha inválida';
    
    return includeTime ? fechaProcesada.fechaConHora : fechaProcesada.fechaFormateada;
  }

  const getLastStatus = (historial) => {
    if (!Array.isArray(historial) || historial.length === 0) return ''
    const sortedHistory = [...historial].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    return sortedHistory[0].estado
  }

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE)
  }

  const getSortedHistory = (historial) => {
    if (!Array.isArray(historial)) return []
    return [...historial].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  }

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState error={error} />
  if (!jobs?.length) return <EmptyState />

  const displayedJobs = jobs.slice(0, displayCount)
  const hasMore = displayCount < jobs.length

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
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span>{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
          </Button>
        </div>
        <div className="text-sm text-blue-500">
          Mostrando {displayedJobs.length} de {jobs.length} trabajos
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
                  <Badge variant="secondary" className="bg-rose-900/70 border border-rose-800">
                    {job.delayDays} {job.delayDays === 1 ? 'día' : 'días'} de atraso
                  </Badge>
                </div>
                <Badge variant="secondary" className="bg-slate-700 border text-xl text-white border-slate-600">
                  {getLastStatus(job.historial)}
                </Badge>
              </div>
              <div className="text-xs mt-2 flex justify-between text-gray-300">
                <span>Ingreso: {formatDate(job.entryDate)}</span>
                <span className='bg-slate-700 border border-slate-600 rounded-md px-2 py-1'>
                  Fecha de entrega: {formatDate(job.fechaEntregaOriginal)}
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
                              {formatDate(entry.fecha)}
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
