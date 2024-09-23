// src/components/WorkerMontageView.js
'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJobs, addJob } from '@/utils/jobUtils'
import { useJobErrors } from '@/hooks/useJobErrors'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useSession } from 'next-auth/react'
import SpreadsheetLink from './SpreadsheetLink'
import { getUserRole } from '@/config/roles'
import JobTable from './JobTable'
import TimeFrameSelector from './TimeFrameSelector'

const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1Y0Yc9Kt3XtwNgfl8kty87qWbroVu7cGOeGDu-LjKa_Q/edit?gid=0#gid=0'
const COLUMNS = ['Número de Trabajo', 'Fecha y Hora', 'Usuario']
const ACTIVE_PAGE = 'montage'

export default function WorkerMontageView() {
  const [jobNumber, setJobNumber] = useState('')
  const [activeTimeFrame, setActiveTimeFrame] = useState('today')
  const queryClient = useQueryClient()
  const { handleError, error, clearError } = useJobErrors()
  const { data: session } = useSession()

  const userRole = session?.user?.role || (session ? getUserRole(session.user.email) : null)

  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['jobs', activeTimeFrame, userRole],
    queryFn: () => fetchJobs(activeTimeFrame, userRole),
    retry: 3,
    onError: handleError,
    enabled: !!userRole
  })

  const addJobMutation = useMutation({
    mutationFn: (jobNumber) => addJob(jobNumber, session?.user?.email, 'workerMontage', ACTIVE_PAGE),
    onSuccess: (newJob) => {
      refetch()
      setJobNumber('')
      clearError()
    },
    onError: handleError
  })

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    if (jobNumber.length !== 8 && jobNumber.length !== 10) return
    addJobMutation.mutate(jobNumber)
  }, [jobNumber, addJobMutation])

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10)
    setJobNumber(value)
  }

  const sortedJobs = useMemo(() => {
    return jobs ? [...jobs].sort((a, b) => new Date(b[1]) - new Date(a[1])) : []
  }, [jobs])

  const completedJobsCount = sortedJobs.length

  if (isLoading) return <div className="text-center text-gray-300">Cargando trabajos...</div>

  return (
    <div className="space-y-6 pb-16">
      <form onSubmit={handleSubmit} className="flex justify-center">
        <div className="flex items-center w-full max-w-md">
          <input
            type="text"
            value={jobNumber}
            onChange={handleInputChange}
            placeholder="Número de trabajo (8 o 10 dígitos)"
            className="flex-grow bg-gray-800 border border-gray-700 rounded-l p-2 focus:outline-none focus:ring-2 focus:ring-blue-800 text-gray-100"
            aria-label="Ingrese número de trabajo"
          />
          <button 
            type="submit" 
            className="bg-blue-800 text-white px-4 py-2 rounded-r hover:bg-blue-800 transition duration-200 disabled:bg-gray-600"
            disabled={addJobMutation.isLoading || (jobNumber.length !== 8 && jobNumber.length !== 10)}
          >
            {addJobMutation.isLoading ? 'Agregando...' : 'Agregar'}
          </button>
        </div>
      </form>

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

      <TimeFrameSelector activeTimeFrame={activeTimeFrame} setActiveTimeFrame={setActiveTimeFrame} />

      <JobTable 
        title={`Trabajos de ${activeTimeFrame}`} 
        jobs={sortedJobs}
        columns={COLUMNS}
      />

      <SpreadsheetLink href={SPREADSHEET_URL} />
    </div>
  )
}