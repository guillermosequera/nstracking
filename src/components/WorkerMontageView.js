// src/components/WorkerMontageView.js
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

const SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${sheetIds.workerMontage}/edit#gid=0`
const COLUMNS = [
  { key: 'jobNumber', header: 'N° Orden' },
  { key: 'timestamp', header: 'Fecha y Hora' },
  { key: 'status', header: 'Estado' },
  { key: 'user', header: 'Usuario' }
]

const statusFilterOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'Montaje', label: 'En Montaje' },
  { value: 'Reparacion', label: 'Reparación' },
  { value: 'Merma', label: 'Mermas' }
]

export default function WorkerMontageView() {
  
  const [jobNumber, setJobNumber] = useState('')
  const [activeTimeFrame, setActiveTimeFrame] = useState('today')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all')
  const [queueStatus, setQueueStatus] = useState({ pending: 0, failed: 0 });
  
  const queryClient = useQueryClient()
  const { handleError } = useJobErrors()
  const { data: session } = useSession()

  const { data: allJobs = [], isLoading, refetch } = useQuery({
    queryKey: ['montage-jobs', activeTimeFrame],
    queryFn: () => fetchJobs(activeTimeFrame, 'workerMontage'),
    retry: 3,
    onError: handleError,
    enabled: !!session?.user?.email
  })

  // Usamos el hook para pre-filtrar por fecha
  const timeFilteredJobs = useTimeFrameData(allJobs, activeTimeFrame);

  // Solo aplicamos el filtro por estado
  const filteredJobs = useMemo(() => {
    return timeFilteredJobs
      .filter(job => {
        const [area] = (job[2] || '').split(' - ');
        return selectedStatusFilter === 'all' || area === selectedStatusFilter;
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
      role: 'workerMontage',
      activePage: 'montage',
      status: formattedStatus,
      timestamp
    });

    queryClient.setQueryData(['montage-jobs'], (old) => {
      const newRow = [jobNumberValue, timestamp, formattedStatus, session?.user?.email];
      
      if (!old || !Array.isArray(old) || old.length === 0) {
        return [['jobNumber', 'timestamp', 'status', 'user'], newRow];
      }
      
      const [headers, ...rows] = old;
      return [headers, newRow, ...rows];
    });
    
    refetch();
    setJobNumber('');
  }, [session?.user?.email, queryClient, refetch]);

  useEffect(() => {
    const interval = setInterval(() => {
      const status = jobQueue.getStatus();
      setQueueStatus(status);
      
      if (status.pending === 0) {
        refetch(); // Refetch cuando la cola esté vacía
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <div className="space-y-6 pb-16">
      <div className="space-y-4 bg-gray-200 p-4 rounded-lg shadow-xl">
        <JobNumberInput 
          jobNumber={jobNumber}
          setJobNumber={setJobNumber}
          isLoading={isLoading}
          onSubmit={handleSubmit}
        />
      </div>

      <div className="flex justify-center space-x-4">
        {statusFilterOptions.map(({ value, label }) => (
          <Button
            key={value}
            onClick={() => setSelectedStatusFilter(value)}
            variant={selectedStatusFilter === value ? "default" : "outline"}
            className={`transition-all shadow-xl duration-200 ${
              selectedStatusFilter === value 
                ? "bg-blue-800" 
                : "bg-slate-200"
            }`}
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
        title="Trabajos de Montaje"
        jobs={filteredJobs}
        columns={COLUMNS}
        timeFrame={activeTimeFrame}
        enableScroll={true}
        role="workerMontage"
        onError={handleError}
        onRefresh={refetch}
        isLoading={isLoading}
        pendingJobs={queueStatus.pending}
      />

      <SpreadsheetLink href={SPREADSHEET_URL} />
    </div>
  );
}