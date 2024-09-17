'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJobs, addJob } from '@/utils/jobUtils'
import { useJobErrors } from '@/hooks/useJobErrors'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { useSession } from 'next-auth/react'
import SpreadsheetLink from './SpreadsheetLink'
import JobNumberInput from './JobNumberInput'

const timeFrames = [
  { key: 'today', label: 'Hoy' },
  { key: 'yesterday', label: 'Ayer' },
  { key: 'twoDaysAgo', label: 'Antes de Ayer' },
  { key: 'week', label: 'Esta Semana' },
  { key: 'month', label: 'Este Mes' },
  { key: 'lastMonth', label: 'Mes Pasado' }
]

const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1i2MYkRhJi9NDh-uHn6GLkIaDwe7TAvZT2vYPqh8TVkA/edit?gid=0#gid=0'

export default function WorkerWarehouseView() {
  const [jobNumber, setJobNumber] = useState('')
  const [activeTimeFrame, setActiveTimeFrame] = useState('today')
  const queryClient = useQueryClient()
  const { handleError, error, clearError } = useJobErrors()
  const { data: session } = useSession()

  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['jobs', activeTimeFrame, 'warehouse'],
    queryFn: () => fetchJobs(activeTimeFrame, 'workerWareHouse'),
    retry: 3,
    onError: handleError
  })

  const addJobMutation = useMutation({
    mutationFn: (jobNumber) => addJob(jobNumber, session.user.email, 'workerWareHouse'),
    onSuccess: (newJob) => {
      refetch()
      setJobNumber('')
      clearError()
    },
    onError: handleError
  })

  const handleSubmit = useCallback((jobNumber) => {
    addJobMutation.mutate(jobNumber)
  }, [addJobMutation])

  const sortedJobs = useMemo(() => {
    return jobs ? [...jobs].sort((a, b) => new Date(b[1]) - new Date(a[1])) : []
  }, [jobs])

  const completedJobsCount = sortedJobs.length

  if (isLoading) return <div className="text-center text-gray-300">Cargando trabajos...</div>

  return (
    <div className="space-y-6 pb-16">
      <JobNumberInput
        jobNumber={jobNumber}
        setJobNumber={setJobNumber}
        isLoading={addJobMutation.isLoading}
        onSubmit={handleSubmit}
      />

      {error && (
        <Alert variant="destructive" className="bg-red-900 border-red-700 text-red-100">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <Badge variant="secondary" className="text-lg bg-gray-800 text-gray-100">
          Trabajos completados: {completedJobsCount}
        </Badge>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {timeFrames.map(({ key, label }) => (
            <Button
              key={key}
              onClick={() => setActiveTimeFrame(key)}
              variant={activeTimeFrame === key ? "default" : "outline"}
              className={`transition-all duration-200 ${activeTimeFrame === key ? "bg-blue-800 text-white" : "bg-gray-700 text-gray-400"}`}
            >
              {label}
            </Button>
          ))}
        </div>

        <JobTable title={`Trabajos de ${timeFrames.find(tf => tf.key === activeTimeFrame).label}`} jobs={sortedJobs} />
      </div>

      <SpreadsheetLink href={SPREADSHEET_URL} />
    </div>
  )
}

function JobTable({ title, jobs }) {
  if (!jobs || jobs.length === 0) {
    return (
      <div>
        <h2 className='text-2xl font-semibold mb-4'>{title}</h2>
        <p className='text-gray-400'>No hay trabajos para mostrar.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-blue-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-green-100 uppercase tracking-wider">Número de Trabajo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-green-100 uppercase tracking-wider">Fecha y Hora</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-green-100 uppercase tracking-wider">Usuario</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {jobs.map((job, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-850' : 'bg-gray-800'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">{job[0]}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {new Date(job[1]).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{job[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}