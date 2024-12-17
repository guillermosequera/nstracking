'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchJobs } from '@/utils/jobUtils'
import { useJobErrors } from '@/hooks/useJobErrors'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/Button'
import { useSession } from 'next-auth/react'
import { useTimeFrameData } from './TimeFrameSelector'
import SpreadsheetLink from './SpreadsheetLink'
import JobTable from './JobTable'
import TimeFrameSelector from './TimeFrameSelector'
import { sheetIds } from '@/config/roles'
import JobNumberInput from './JobNumberInput'
//import { useTheme } from 'next-themes'
import { jobQueue } from '@/utils/jobQueue'

const SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${sheetIds.workerLabs}/edit?gid=0#gid=0`
const COLUMNS = [
  { key: 'jobNumber', header: 'N° Orden' },
  { key: 'timestampFormatted', header: 'Fecha y Hora' },
  { key: 'status', header: 'Estado' },
  { key: 'user', header: 'Usuario' }
]

const statusFilterOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'polimeros', label: 'Superficie Polímeros' },
  { value: 'mineral', label: 'Superficie Mineral' },
  { value: 'tratamiento', label: 'Tratamiento' },
  { value: 'Merma', label: 'Mermas' }
]

export default function WorkerLabsView() {
  
  const [jobNumber, setJobNumber] = useState('')
  const [activeTimeFrame, setActiveTimeFrame] = useState('today')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all')
  const [queueStatus, setQueueStatus] = useState({ pending: 0, failed: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const queryClient = useQueryClient()
  const { handleError, error, clearError } = useJobErrors()
  const { data: session } = useSession()

  const { data: allJobs = [], isLoading, refetch } = useQuery({
    queryKey: ['labs-jobs', activeTimeFrame],
    queryFn: () => fetchJobs(activeTimeFrame, 'workerLabs'),
    retry: 3,
    onError: handleError,
    enabled: !!session?.user?.email
  })

  const timeFilteredJobs = useTimeFrameData(allJobs, activeTimeFrame);

  const filteredJobs = useMemo(() => {
    return timeFilteredJobs
      .filter((job, index) => {
        if (!job) return false;
        const [area, option] = (job[2] || '').split(' - ');
        
        switch(selectedStatusFilter) {
          case 'all': return true;
          case 'polimeros': return area === 'Laboratorio' && option === 'Superficie polimeros';
          case 'mineral': return area === 'Laboratorio' && option === 'Superficie mineral';
          case 'tratamiento': return area === 'Laboratorio' && (
            option === 'Tratamiento' || 
            option === 'Tratamiento AR'
          );
          case 'Merma': return area === 'Merma';
          default: return true;
        }
      })
      .map(job => ({
        jobNumber: job[0],
        timestamp: job[1],
        timestampFormatted: new Date(job[1]).toLocaleString('es-ES', {
          dateStyle: 'medium',
          timeStyle: 'medium'
        }),
        status: job[2],
        user: job[3]
      }));
  }, [timeFilteredJobs, selectedStatusFilter]);

  const handleSubmit = useCallback((jobNumberValue, status) => {
    if (!status) return;
    
    const formattedStatus = `${status.area} - ${status.option}`;
    const now = new Date();
    const timestamp = now.toISOString();
    
    jobQueue.add({
      jobNumber: jobNumberValue,
      userEmail: session?.user?.email,
      role: 'workerLabs',
      activePage: 'labs',
      status: formattedStatus,
      timestamp
    });

    queryClient.setQueryData(['labs-jobs'], (old) => {
      const newRow = [jobNumberValue, timestamp, formattedStatus, session?.user?.email];
      
      if (!old || !Array.isArray(old) || old.length === 0) {
        return [['jobNumber', 'timestamp', 'status', 'user'], newRow];
      }
      
      const [headers, ...rows] = old;
      return [headers, newRow, ...rows];
    });
    
    refetch();
    setJobNumber('');
    clearError();
  }, [session?.user?.email, queryClient, refetch, clearError]);

  useEffect(() => {
    const interval = setInterval(() => {
      const status = jobQueue.getStatus();
      setQueueStatus(status);
      
      if (status.pending === 0) {
        refetch();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [refetch]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  return (
    <div className="space-y-6 pb-16">
      <div className="space-y-4 bg-gray-200 p-4 rounded-lg">
        <JobNumberInput 
          jobNumber={jobNumber}
          setJobNumber={setJobNumber}
          isLoading={false}
          onSubmit={handleSubmit}
          hideStatusSelector={false}
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
            className={selectedStatusFilter === value ? "bg-blue-800 shadow-xl" : "bg-gray-300 shadow-xl"}
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

      {queueStatus.pending > 0 && (
        <Alert>
          <AlertDescription>
            {queueStatus.pending} trabajos pendientes de sincronizar
          </AlertDescription>
        </Alert>
      )}

      {queueStatus.failed > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            {queueStatus.failed} trabajos fallidos
            <Button onClick={() => jobQueue.retryFailedJobs()}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <JobTable 
        title="Trabajos de Laboratorio"
        jobs={filteredJobs}
        columns={COLUMNS}
        timeFrame={activeTimeFrame}
        enableScroll={true}
        role="workerLabs"
        onError={handleError}
        onRefresh={handleRefresh}
        isLoading={isLoading || isRefreshing}
        pendingJobs={queueStatus.pending}
        spreadsheetId={sheetIds.workerLabs}
      />

      <SpreadsheetLink href={SPREADSHEET_URL} />
    </div>
  )
}