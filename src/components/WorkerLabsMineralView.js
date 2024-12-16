import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJobs, addJob } from '@/utils/jobUtils'
import { useJobErrors } from '@/hooks/useJobErrors'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/Button'
import { useSession } from 'next-auth/react'
import JobNumberInput from './JobNumberInput'
import SpreadsheetLink from './SpreadsheetLink'
import JobTable from './JobTable'
import TimeFrameSelector from './TimeFrameSelector'
import { useTimeFrameFilter } from './TimeFrameSelector'
import { sheetIds } from '@/config/roles'

const SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${sheetIds.workerLabsMineral}/edit?gid=0#gid=0`
const COLUMNS = [
  { key: 'jobNumber', header: 'N° Orden' },
  { key: 'timestamp', header: 'Fecha y Hora' },
  { key: 'status', header: 'Estado' },
  { key: 'user', header: 'Usuario' }
]

const statusFilterOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'mineral', label: 'Superficie Mineral' },
  { value: 'reparacion', label: 'Reparación' },
  { value: 'rectificacion', label: 'Rectificación' },
  { value: 'Merma', label: 'Mermas' }
]

export default function WorkerLabsMineralView() {
  const [jobNumber, setJobNumber] = useState('')
  const [activeTimeFrame, setActiveTimeFrame] = useState('today')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all')
  
  const queryClient = useQueryClient()
  const { handleError, error, clearError } = useJobErrors()
  const { data: session } = useSession()

  const { data: allJobs = [], isLoading } = useQuery({
    queryKey: ['mineral-jobs', activeTimeFrame],
    queryFn: () => fetchJobs(activeTimeFrame, 'workerLabsMineral'),
    retry: 3,
    onError: handleError,
    enabled: !!session?.user?.email,
    refetchInterval: 30000
  })

  const filteredJobs = useTimeFrameFilter(allJobs || [], activeTimeFrame)
    .filter((job, index) => {
      if (!job || index === 0) return false;
      
      // Extraemos área y opción del estado
      const [area, option] = (job[2] || '').split(' - ');
      
      switch(selectedStatusFilter) {
        case 'all':
          return true;
        case 'mineral':
          return area === 'Laboratorio' && option === 'Superficie mineral';
        case 'reparacion':
          return area === 'Laboratorio' && option === 'Reparacion';
        case 'rectificacion':
          return area === 'Laboratorio' && option === 'Rectificacion';
        case 'Merma':
          return area === 'Merma' && (
            option === 'Merma laboratorio'
          );
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
      user: job[3]
    }))

  const addJobMutation = useMutation({
    mutationFn: (jobData) => addJob(
      jobData.jobNumber,
      session?.user?.email,
      'workerLabsMineral',
      'labsMineral',
      jobData.status
    ),
    onSuccess: () => {
      queryClient.invalidateQueries(['mineral-jobs'])
      setJobNumber('')
      clearError()
    },
    onError: handleError
  })

  const handleSubmit = useCallback((jobNumberValue, status) => {
    const formattedStatus = `${status.area} - ${status.option}`;
    
    addJobMutation.mutate({ 
      jobNumber: jobNumberValue,
      status: formattedStatus
    })
  }, [addJobMutation])

  if (isLoading) return <div className="text-center text-gray-300">Cargando trabajos...</div>

  return (
    <div className="space-y-6 pb-16">
      <div className="space-y-4 bg-gray-900 p-4 rounded-lg">
        <JobNumberInput 
          jobNumber={jobNumber}
          setJobNumber={setJobNumber}
          isLoading={addJobMutation.isLoading}
          onSubmit={handleSubmit}
        />
      </div>

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
        title="Trabajos de Laboratorio Mineral"
        jobs={filteredJobs}
        columns={COLUMNS}
        timeFrame={activeTimeFrame}
        enableScroll={true}
        role="workerLabsMineral"
        onError={handleError}
      />

      <SpreadsheetLink href={SPREADSHEET_URL} />
    </div>
  )
}