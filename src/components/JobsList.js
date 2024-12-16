// components/JobsList.js
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'

const ITEMS_PER_PAGE = 100

export default function JobsList({ 
  jobs = [], 
  title,
  getJobColor = () => 'bg-slate-800 border-slate-700',
  badgeContent = (job) => null,
  headerContent = (job) => null,
  footerContent = (job) => null,
  historyColumns = [
    { key: 'timestamp', label: 'Fecha y Hora' },
    { key: 'area', label: 'Área' },
    { key: 'status', label: 'Estado' },
    { key: 'user', label: 'Usuario' }
  ],
  isLoading = false,
  error = null,
}) {
  const [expandedJob, setExpandedJob] = useState(null)
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)

  if (isLoading) return <LoadingState title={title} />
  if (error) return <ErrorState title={title} error={error} />
  if (!jobs?.length) return <EmptyState title={title} />

  const displayedJobs = jobs.slice(0, displayCount)
  const hasMore = displayCount < jobs.length

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-blue-600">{title}</h1>
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
            className={`mb-4 rounded-lg overflow-hidden shadow-lg ${getJobColor(job)}`}
          >
            {/* Card Header */}
            <div 
              className="p-4 cursor-pointer"
              onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
            >
              <div className="flex justify-between items-center text-xl text-gray-100">
                {headerContent(job)}
              </div>
              <div className="text-xs mt-2 flex justify-between text-gray-300">
                {footerContent(job)}
              </div>
            </div>

            {/* Expandable History */}
            <AnimatePresence>
              {expandedJob === job.id && job.history && (
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
                          {historyColumns.map(col => (
                            <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-600">
                        {job.history.map((entry, index) => (
                          <tr key={index} className="hover:bg-slate-700/30">
                            {historyColumns.map(col => (
                              <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {entry[col.key]}
                              </td>
                            ))}
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
            onClick={() => setDisplayCount(prev => prev + ITEMS_PER_PAGE)}
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