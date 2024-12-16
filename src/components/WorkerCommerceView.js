'use client'

import { useState, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJobs, onDelete } from '@/utils/jobUtils'
import { useJobErrors } from '@/hooks/useJobErrors'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { useSession } from 'next-auth/react'
import SpreadsheetLink from './SpreadsheetLink'
import DriveFolderLink from './DriveFolderLink'
import CommerceJobTable from './CommerceJobTable'
import TimeFrameSelector from './TimeFrameSelector'
import { useTimeFrameFilter } from './TimeFrameSelector'
import { sheetIds } from '@/config/roles'
import { getUserRole } from '@/config/roles'

const SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${sheetIds.workerCommerce}/edit?gid=0#gid=0`
const DRIVE_FOLDER_URL = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_URL
const COLUMNS = [
  { key: 'jobNumber', header: 'N° Orden' },
  { key: 'timestamp', header: 'Fecha y Hora' },
  { key: 'deliveryDate', header: 'Fecha de Entrega' },
  { key: 'lenswareNumber', header: 'Número de Lensware' },
  { key: 'file', header: 'Archivo' },
  { key: 'user', header: 'Usuario' }
]
const ACTIVE_PAGE = 'workerCommerce'

export default function WorkerCommerceView() {
  const [jobNumber, setJobNumber] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [lenswareNumber, setLenswareNumber] = useState('')
  const [file, setFile] = useState(null)
  const [activeTimeFrame, setActiveTimeFrame] = useState('today')
  const [pastedImagePreview, setPastedImagePreview] = useState(null)
  const formRef = useRef(null)

  const queryClient = useQueryClient()
  const { handleError, error, clearError } = useJobErrors()
  const { data: session } = useSession()

  const { data: allJobs = [], isLoading, refetch } = useQuery({
    queryKey: ['commerce-jobs', activeTimeFrame],
    queryFn: () => fetchJobs(activeTimeFrame, 'workerCommerce'),
    retry: 3,
    onError: handleError,
    enabled: !!session?.user?.email,
    refetchInterval: 30000
  })

  const filteredJobs = useTimeFrameFilter(allJobs || [], activeTimeFrame)
    .filter((job, index) => {
      if (!job || index === 0) return false;
      return true;
    })
    .map(job => ({
      jobNumber: job[0],
      timestamp: job[1],
      deliveryDate: job[2],
      lenswareNumber: job[3],
      file: job[4],
      user: job[5]
    }));

  const addJobMutation = useMutation({
    mutationFn: async (jobData) => {
      if (!session?.user?.email) {
        throw new Error('No se ha iniciado sesión');
      }
      const formData = new FormData();
      if (pastedImagePreview) {
        const base64Image = pastedImagePreview.split(',')[1];
        const byteCharacters = atob(base64Image);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        const pastedFile = new File([blob], "pasted_image.png", { type: "image/png" });
        formData.append('file', pastedFile);
      } else if (file) {
        formData.append('file', file);
      }
      formData.append('jobNumber', jobData.jobNumber);
      formData.append('deliveryDate', jobData.deliveryDate);
      formData.append('lenswareNumber', jobData.lenswareNumber);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload file and add job');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['commerce-jobs']);
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
    setPastedImagePreview(null)
  }

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    if (jobNumber.length !== 8 && jobNumber.length !== 10) {
      handleError(new Error('El número de trabajo debe tener 8 o 10 dígitos'));
      return;
    }
    if (!deliveryDate) {
      handleError(new Error('La fecha de entrega es obligatoria'));
      return;
    }
    
    const jobData = {
      jobNumber,
      deliveryDate,
      lenswareNumber,
    }
    
    addJobMutation.mutate(jobData)
  }, [addJobMutation, jobNumber, deliveryDate, lenswareNumber, file, pastedImagePreview, session?.user?.email])

  const handleJobNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10)
    setJobNumber(value)
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    setFile(selectedFile)
    setPastedImagePreview(null)
  }

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => {
          setPastedImagePreview(event.target.result);
        };
        reader.readAsDataURL(blob);
        setFile(new File([blob], "pasted_image.png", { type: "image/png" }));
        break;
      }
    }
  }, []);

  const handleDelete = useCallback(async (jobNumber, timestamp) => {
    if (window.confirm(`¿Estás seguro de eliminar el trabajo ${jobNumber}?`)) {
      try {
        await onDelete(jobNumber, timestamp, 'workerCommerce', session?.user?.email);
        queryClient.invalidateQueries(['commerce-jobs']);
        clearError();
      } catch (error) {
        handleError(error);
      }
    }
  }, [queryClient, clearError, handleError, session?.user?.email]);

  if (isLoading) return <div className="text-center text-gray-300">Cargando trabajos...</div>

  return (
    <div className="space-y-6 pb-16">
      <div className="space-y-4 bg-gray-400 p-4 rounded-lg">
        <form onSubmit={handleSubmit} ref={formRef} onPaste={handlePaste}>
          <div className="flex items-center w-full my-4 max-w-md mx-auto shadow-xl">
            <Input
              type="text"
              value={jobNumber}
              onChange={handleJobNumberChange}
              placeholder="Número de trabajo (8 o 10 dígitos)"
              className="flex-grow bg-gray-300 border border-gray-700 rounded-l p-2 focus:outline-none focus:ring-2 focus:ring-blue-800 text-gray-800"
            />
            <Button 
              type="submit" 
              className="bg-blue-800 text-white px-4 py-2 rounded-r hover:bg-blue-700 transition duration-200 disabled:bg-gray-600"
              disabled={addJobMutation.isLoading || (jobNumber.length !== 8 && jobNumber.length !== 10) || !deliveryDate}
            >
              {addJobMutation.isLoading ? 'Agregando...' : 'Agregar'}
            </Button>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="bg-gray-300 text-gray-800 shadow-xl border border-gray-700 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-800 text-gray-100"
              required
            />
            <Input
              type="text"
              value={lenswareNumber}
              onChange={(e) => setLenswareNumber(e.target.value)}
              placeholder="Número de Lensware (opcional)"
              className="bg-gray-300 text-gray-800 shadow-xl border border-gray-700 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-800 text-gray-100"
            />
            <Input
              type="file"
              onChange={handleFileChange}
              className="bg-gray-300 text-gray-800 shadow-xl border border-gray-700 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-800 text-gray-100"
            />
            {pastedImagePreview && (
              <div className="mt-2">
                <p className="text-sm text-gray-300 mb-1">Imagen pegada:</p>
                <img src={pastedImagePreview} alt="Pasted" className="max-w-full h-auto" />
              </div>
            )}
          </div>
        </form>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-900 border-red-700 text-red-100">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}


      <TimeFrameSelector 
        activeTimeFrame={activeTimeFrame} 
        setActiveTimeFrame={setActiveTimeFrame}
        data={allJobs}
      />

      <CommerceJobTable 
        title="Trabajos de Comercio"
        jobs={filteredJobs}
        columns={COLUMNS}
        timeFrame={activeTimeFrame}
        enableScroll={true}
        role="workerCommerce"
        onError={handleError}
        onDelete={handleDelete}
      />

      <SpreadsheetLink href={SPREADSHEET_URL} />
      <DriveFolderLink href={DRIVE_FOLDER_URL} />
    </div>
  )
}