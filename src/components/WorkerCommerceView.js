'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJobs, addJob } from '@/utils/jobUtils'
import { useJobErrors } from '@/hooks/useJobErrors'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { useSession } from 'next-auth/react'
import SpreadsheetLink from './SpreadsheetLink'
import JobTable from './JobTable'
import TimeFrameSelector from './TimeFrameSelector'

const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/11gPVktoCBHimINlJiNczAY4oiAeTLMGAHq8inxusF_w/edit?gid=0#gid=0'
const COLUMNS = ['Número de Trabajo', 'Fecha y Hora', 'Fecha de Entrega', 'Número de Lensware', 'Archivo', 'Usuario']
const ACTIVE_PAGE = 'commerce'

export default function WorkerCommerceView() {
  const [jobNumber, setJobNumber] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [lenswareNumber, setLenswareNumber] = useState('')
  const [file, setFile] = useState(null)
  const [activeTimeFrame, setActiveTimeFrame] = useState('today')
  const queryClient = useQueryClient()
  const { handleError, error, clearError } = useJobErrors()
  const { data: session } = useSession()

  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['jobs', activeTimeFrame, 'workerCommerce'],
    queryFn: () => fetchJobs(activeTimeFrame, 'workerCommerce'),
    retry: 3,
    onError: handleError
  })

  const uploadFileMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      return response.json();
    },
    onError: handleError,
  });

  const addJobMutation = useMutation({
    mutationFn: async (jobData) => {
      let fileLink = '';
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('jobNumber', jobData.jobNumber);
        const uploadResult = await uploadFileMutation.mutateAsync(formData);
        fileLink = uploadResult.fileLink;
      }
      return addJob({ ...jobData, fileLink }, session?.user?.email, 'workerCommerce', ACTIVE_PAGE);
    },
    onSuccess: (newJob) => {
      refetch();
      resetForm();
      clearError();
    },
    onError: handleError,
  });

  const resetForm = () => {
    setJobNumber('')
    setDeliveryDate('')
    setLenswareNumber('')
    setFile(null)
  }

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    if (jobNumber.length !== 8 && jobNumber.length !== 10) return
    
    const jobData = {
      jobNumber,
      deliveryDate,
      lenswareNumber,
    }
    
    addJobMutation.mutate(jobData)
  }, [jobNumber, deliveryDate, lenswareNumber, file, addJobMutation])

  const handleJobNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10)
    setJobNumber(value)
  }

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const sortedJobs = useMemo(() => {
    return jobs ? [...jobs].sort((a, b) => new Date(b[1]) - new Date(a[1])) : []
  }, [jobs])

  const completedJobsCount = sortedJobs.length

  if (isLoading) return <div className="text-center text-gray-300">Cargando trabajos...</div>

  return (
    <div className="space-y-6 pb-16">
      <form onSubmit={handleSubmit} className="space-y-4 bg-gray-900 p-4 rounded-lg">
        <div className="flex items-center w-full max-w-md mx-auto">
          <Input
            type="text"
            value={jobNumber}
            onChange={handleJobNumberChange}
            placeholder="Número de trabajo (8 o 10 dígitos)"
            className="flex-grow bg-gray-800 border border-gray-700 rounded-l p-2 focus:outline-none focus:ring-2 focus:ring-blue-800 text-gray-100"
          />
          <Button 
            type="submit" 
            className="bg-blue-800 text-white px-4 py-2 rounded-r hover:bg-blue-700 transition duration-200 disabled:bg-gray-600"
            disabled={addJobMutation.isLoading || (jobNumber.length !== 8 && jobNumber.length !== 10)}
          >
            {addJobMutation.isLoading ? 'Agregando...' : 'Agregar'}
          </Button>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-800 text-gray-100"
          />
          <Input
            type="text"
            value={lenswareNumber}
            onChange={(e) => setLenswareNumber(e.target.value)}
            placeholder="Número de Lensware"
            className="bg-gray-800 border border-gray-700 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-800 text-gray-100"
          />
          <Input
            type="file"
            onChange={handleFileChange}
            className="bg-gray-800 border border-gray-700 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-800 text-gray-100"
          />
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

      <div className="overflow-x-auto bg-gray-900 rounded-lg shadow">
        <JobTable 
          title={`Trabajos de ${activeTimeFrame}`} 
          jobs={sortedJobs}
          columns={COLUMNS}
        />
      </div>

      <SpreadsheetLink href={SPREADSHEET_URL} />
    </div>
  )
}