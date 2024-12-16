'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchQualityJobs, addQualityJob } from '@/utils/jobUtils'
import { useJobErrors } from '@/hooks/useJobErrors'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/Button'
import { useSession } from 'next-auth/react'
import { useTimeFrameFilter } from './TimeFrameSelector'
import SpreadsheetLink from './SpreadsheetLink'
import JobTable from './JobTable'
import JobNumberInput from './JobNumberInput'
import StatusSelector from './StatusSelector'
import TimeFrameSelector from './TimeFrameSelector'
import { sheetIds } from '@/config/roles'

const SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${sheetIds.workerQuality}/edit?gid=0#gid=0`

const COLUMNS = [
  { key: 'jobNumber', header: 'N° Orden' },
  { key: 'timestamp', header: 'Fecha y Hora' },
  { key: 'status', header: 'Estado' },
  { key: 'user', header: 'Responsable' },
  { key: 'notes', header: 'Notas' }
]

const statusFilterOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'control', label: 'Control Calidad' },
  { value: 'Merma', label: 'Mermas' },
  { value: 'garantia', label: 'Garantías' }
]

export default function WorkerQualityView() {
  const [jobNumber, setJobNumber] = useState('')
  const [activeTimeFrame, setActiveTimeFrame] = useState('today')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all')
  
  const queryClient = useQueryClient()
  const { handleError, error, clearError } = useJobErrors()
  const { data: session } = useSession()

  const { data: allJobs = [], isLoading } = useQuery({
    queryKey: ['quality-jobs', activeTimeFrame],
    queryFn: () => fetchQualityJobs('quality'), // Siempre traemos de la hoja principal
    retry: 3,
    onError: handleError,
    enabled: !!session?.user?.email,
    refetchInterval: 30000
  })

  const filteredJobs = useTimeFrameFilter(allJobs || [], activeTimeFrame)
    .filter((job, index) => {
      if (!job || index === 0) return false;
      
      // Extraemos área y opción del estado
      const [area, option] = job[3].split(' - ');
      
      switch(selectedStatusFilter) {
        case 'all':
          return true;
        case 'control':
          return area === 'Control Calidad' && option !== 'Garantia';
        case 'garantia':
          return area === 'Control Calidad' && option === 'Garantia';
        case 'Merma':
          return area === 'Merma';
        default:
          return true;
      }
    })
    .map((job) => ({
      jobNumber: job[0],
      timestamp: new Date(job[1]).toLocaleString('es-ES', {
        dateStyle: 'medium',
        timeStyle: 'medium'
      }),
      status: job[2],
      user: job[3],
      notes: job[4]
    }))

  const addJobMutation = useMutation({
    mutationFn: (jobData) => addQualityJob(jobData, session?.user?.email),
    onSuccess: () => {
      queryClient.invalidateQueries(['quality-jobs'])
      setJobNumber('')
      clearError()
    },
    onError: handleError
  })

  const handleSubmit = useCallback((jobNumberValue, status) => {
    const formattedStatus = `${status.area} - ${status.option}`;
    
    addJobMutation.mutate({ 
      jobNumber: jobNumberValue,
      status: formattedStatus,
      notes: status.comment || ''
    })
  }, [addJobMutation])

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

      <div className="flex justify-center space-x-4">
        {statusFilterOptions.map(({ value, label }) => (
          <Button
            key={value}
            onClick={() => setSelectedStatusFilter(value)}
            variant={selectedStatusFilter === value ? "default" : "outline"}
            className={selectedStatusFilter === value ? "bg-blue-800" : "bg-gray-700"}
          >
            {label}
          </Button>
        ))}
      </div>

      <TimeFrameSelector 
        activeTimeFrame={activeTimeFrame} 
        setActiveTimeFrame={setActiveTimeFrame}
        data={allJobs}
      />

      <JobTable 
        title={`Trabajos de Control de Calidad`}
        jobs={filteredJobs}
        columns={COLUMNS}
        timeFrame={activeTimeFrame}
        enableScroll={true}
        role="workerQuality"
        onError={handleError}
      />

      <SpreadsheetLink href={SPREADSHEET_URL} />
    </div>
  )
}