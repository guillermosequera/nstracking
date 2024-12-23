'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge.js'
import { Button } from '@/components/ui/Button.js'
import LoadingState from '@/components/LoadingState'
import ErrorState from '@/components/ErrorState'
import EmptyState from '@/components/EmptyState'

const ITEMS_PER_PAGE = 100

export default function ProductionJobsList({ jobs, status, category }) {
  const [expandedJob, setExpandedJob] = useState(null)
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)

  const getJobColor = (deliveryCategory) => {
    switch (deliveryCategory) {
      case 'moreThan10Days': return 'bg-red-900/80 border-red-800'
      case 'moreThan6Days': return 'bg-orange-900/70 border-orange-800'
      case 'moreThan2Days': return 'bg-yellow-900/60 border-yellow-800'
      default: return 'bg-green-900/60 border-green-800'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible'
    
    try {
      // Para fechas en formato ISO (UTC)
      if (dateString.includes('T')) {
        const date = new Date(dateString)
        // Ajustamos la fecha a UTC para evitar conversiones automáticas
        const utcDate = new Date(Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          date.getUTCHours(),
          date.getUTCMinutes()
        ))
        
        return utcDate.toLocaleString('es-CL', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'UTC'
        }).replace(/\//g, '-')
      }
      
      // Para fechas ya formateadas con guiones (DD-MM-YYYY)
      if (dateString.includes('-')) {
        const [day, month, year] = dateString.split('-').map(num => num.trim())
        const utcDate = new Date(Date.UTC(year, month - 1, day))
        return utcDate.toLocaleString('es-CL', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'UTC'
        }).replace(/\//g, '-')
      }

      return dateString
    } catch (error) {
      console.log('Error al procesar fecha:', error)
      return dateString
    }
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

  if (!jobs?.length) return <EmptyState />

  const displayedJobs = jobs.slice(0, displayCount)
  const hasMore = displayCount < jobs.length

  return (
    <div className="space-y-4">
      <div className="text-sm text-blue-500 text-right">
        Mostrando {displayedJobs.length} de {jobs.length} trabajos
      </div>

      <AnimatePresence>
        {displayedJobs.map((job) => (
          <motion.div
            key={job.number}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={`mb-4 rounded-lg overflow-hidden shadow-lg ${getJobColor(category)}`}
          >
            <div 
              className="p-4 cursor-pointer"
              onClick={() => setExpandedJob(expandedJob === job.number ? null : job.number)}
            >
              <div className="flex justify-between items-center text-xl text-gray-100">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{job.number}</span>
                  <Badge variant="secondary" className="bg-slate-700 border border-slate-600">
                    {status}
                  </Badge>
                </div>
              </div>
              <div className="text-xs mt-2 flex justify-between text-gray-300">
                <span>Ingreso: {formatDate(job.entryDate)}</span>
                <span className='bg-slate-700 border border-slate-600 rounded-md px-2 py-1'>
                  Fecha de entrega: {formatDate(job.deliveryDate)}
                </span>
                <span>Usuario: {job.user}</span>
              </div>
            </div>

            <AnimatePresence>
              {expandedJob === job.number && job.historial && (
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
                        {getSortedHistory(job.historial).map((entry, index) => (
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