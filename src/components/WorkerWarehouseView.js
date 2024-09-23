'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJobs, addJob } from '@/utils/jobUtils'
import { useJobErrors } from '@/hooks/useJobErrors'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useSession } from 'next-auth/react'
import SpreadsheetLink from './SpreadsheetLink'
import JobNumberInput from './JobNumberInput'
import JobTable from './JobTable'
import TimeFrameSelector from './TimeFrameSelector'

const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1i2MYkRhJi9NDh-uHn6GLkIaDwe7TAvZT2vYPqh8TVkA/edit?gid=0#gid=0'
const COLUMNS = ['Nota de venta', 'Fecha y Hora', 'Usuario']
const ACTIVE_PAGE = 'warehouse'

export default function WorkerWarehouseView() {
  const [jobNumber, setJobNumber] = useState('')
  const [activeTimeFrame, setActiveTimeFrame] = useState('today')
  const queryClient = useQueryClient()
  const { handleError, error, clearError } = useJobErrors()
  const { data: session } = useSession()

  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['jobs', activeTimeFrame, 'workerWareHouse'],
    queryFn: () => fetchJobs(activeTimeFrame, 'workerWareHouse'),
    retry: 3,
    onError: handleError
  })

  const addJobMutation = useMutation({
    mutationFn: (jobNumber) => addJob(jobNumber, session.user.email, 'workerWareHouse', ACTIVE_PAGE),
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

      <TimeFrameSelector
        activeTimeFrame={activeTimeFrame}
        setActiveTimeFrame={setActiveTimeFrame}
      />

      <JobTable 
        title={`Trabajos de ${activeTimeFrame}`} 
        jobs={sortedJobs} 
        columns={COLUMNS}
      />

      <SpreadsheetLink href={SPREADSHEET_URL} />
    </div>
  )
}