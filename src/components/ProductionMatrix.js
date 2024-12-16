'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { Badge } from '@/components/ui/badge'
import JobsList from '@/components/JobsList'
import { useProductionMatrix } from '@/hooks/useProductionMatrix'

export default function ProductionMatrix() {
  const [selectedCell, setSelectedCell] = useState(null)
  const { data: session } = useSession()

  const { data: matrix, isLoading, error } = useQuery({
    queryKey: ['production-matrix'],
    queryFn: useProductionMatrix,
    retry: 3,
    enabled: !!session?.user?.email,
    refetchInterval: 30000
  })

  const columns = [
    { key: 'delayOver10', title: 'Atraso > 10 días' },
    { key: 'delayOver6', title: 'Atraso > 6 días' },
    { key: 'delayOver2', title: 'Atraso > 2 días' },
    { key: 'delay1', title: 'Atraso 1 día' },
    { key: 'dueToday', title: 'Entrega Hoy' },
    { key: 'dueTomorrow', title: 'Entrega Mañana' },
    { key: 'dueOver4', title: 'Entrega > 4 días' },
    { key: 'totals', title: 'Total General' }
  ]

  const selectedJobs = selectedCell && matrix?.[selectedCell.column]?.[selectedCell.status]?.jobs?.map(job => ({
    id: job.number,
    number: job.number,
    status: job.status,
    delayDays: job.delayDays,
    lastUpdate: job.lastUpdate,
    area: job.area,
    user: job.user,
    history: job.history.map(entry => ({
      id: `${entry[1]}-${entry[2]}-${entry[3]}`,
      timestamp: entry[1],
      area: entry[2],
      status: entry[3],
      user: entry[4]
    }))
  })) || []

  const getJobColor = (job) => {
    if (job.delayDays > 10) return 'bg-rose-900/80 border-rose-800'
    if (job.delayDays > 6) return 'bg-orange-900/70 border-orange-800'
    if (job.delayDays > 2) return 'bg-amber-900/60 border-amber-800'
    if (job.delayDays === 1) return 'bg-slate-800 border-slate-700'
    return 'bg-slate-800 border-slate-700'
  }

  const handleCellClick = (status, column) => {
    setSelectedCell(selectedCell?.status === status && selectedCell?.column === column 
      ? null 
      : { status, column })
  }

  if (!session) return <div className="p-4 text-center">Por favor inicie sesión...</div>
  if (isLoading) return <div className="p-4 text-center">Cargando matriz de producción...</div>
  if (error) return <div className="p-4 text-center text-red-500">Error: {error.message}</div>
  if (!matrix) return null

  const allStatuses = Object.keys(matrix.totals || {})

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-blue-600">Matriz de Producción</h1>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-slate-800 rounded-lg overflow-hidden">
          <thead>
            <tr>
              <th key="status" className="px-4 py-2 bg-slate-700 text-gray-100">Estado</th>
              {columns.map(col => (
                <th key={col.key} className="px-4 py-2 bg-slate-700 text-gray-100">
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allStatuses.map(status => (
              <tr key={status} className="border-b border-slate-700">
                <td className="px-4 py-2 text-gray-300 font-medium">{status}</td>
                {columns.map(col => {
                  const cellData = matrix[col.key]?.[status]
                  return (
                    <td 
                      key={`${status}-${col.key}`}
                      className={`px-4 py-2 text-center cursor-pointer hover:bg-slate-700/50 
                        ${selectedCell?.status === status && selectedCell?.column === col.key 
                          ? 'bg-slate-700' 
                          : ''
                        }`}
                      onClick={() => handleCellClick(status, col.key)}
                    >
                      <span className="text-gray-300">
                        {cellData?.count || 0}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCell && selectedJobs.length > 0 && (
        <JobsList
          title={`Trabajos en ${selectedCell.status} - ${columns.find(c => c.key === selectedCell.column)?.title}`}
          jobs={selectedJobs}
          getJobColor={getJobColor}
          headerContent={(job) => (
            <>
              <span className="font-medium">N° {job.number}</span>
              <Badge variant="secondary" className="bg-slate-700 text-gray-200 border border-slate-600">
                {job.status}
              </Badge>
            </>
          )}
          footerContent={(job) => (
            <>
              <span>Área: {job.area}</span>
              <span>Usuario: {job.user}</span>
              <span>Última actualización: {new Date(job.lastUpdate).toLocaleString()}</span>
            </>
          )}
          historyColumns={[
            { key: 'timestamp', label: 'Fecha y Hora' },
            { key: 'area', label: 'Área' },
            { key: 'status', label: 'Estado' },
            { key: 'user', label: 'Usuario' }
          ]}
          isLoading={isLoading}
          error={error}
        />
      )}
    </div>
  )
} 