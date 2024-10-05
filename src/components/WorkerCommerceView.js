'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJobs } from '@/utils/jobUtils'
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
import { getUserRole } from '@/config/roles'

const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/11gPVktoCBHimINlJiNczAY4oiAeTLMGAHq8inxusF_w/edit?gid=0#gid=0'
const DRIVE_FOLDER_URL = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_URL
const COLUMNS = ['Número de Trabajo', 'Fecha y Hora', 'Fecha de Entrega', 'Número de Lensware', 'Archivo', 'Usuario']
const ACTIVE_PAGE = 'commerce'

const shortenAndLinkify = (url) => {
  if (!url) return 'No disponible';
  const fileName = url.split('/').pop();
  return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">Ver ${fileName}</a>`;
};

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
  const { data: session, status } = useSession()
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    if (session?.user?.email) {
      try {
        const role = getUserRole(session.user.email);
        if (!role) {
          throw new Error('No se pudo obtener el rol');
        }
        setUserRole(role);
      } catch (err) {
        handleError(err);
      }
    }
  }, [session, handleError]);

  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['jobs', activeTimeFrame, userRole],
    queryFn: () => fetchJobs(activeTimeFrame, userRole),
    retry: 3,
    onError: handleError,
    enabled: !!userRole && status === 'authenticated'
  })

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
  }, [jobNumber, deliveryDate, lenswareNumber, addJobMutation, handleError])

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

  const sortedJobs = useMemo(() => {
    if (!jobs) return [];
    return jobs
      .map(job => {
        const fileLink = shortenAndLinkify(job[4]);
        return [...job.slice(0, 4), fileLink, ...job.slice(5)];
      })
      .sort((a, b) => new Date(b[1]) - new Date(a[1]));
  }, [jobs]);

  const completedJobsCount = sortedJobs.length

  if (status === 'loading') return <div className="text-center text-gray-300">Cargando sesión...</div>

  if (status === 'unauthenticated') return <div className="text-center text-red-500">No se ha iniciado sesión.</div>

  if (!userRole) return <div className="text-center text-red-500">No se pudo determinar el rol del usuario.</div>

  if (isLoading) return <div className="text-center text-gray-300">Cargando trabajos...</div>

  return (
    <div className="space-y-6 pb-16">
      <form onSubmit={handleSubmit} className="space-y-4 bg-gray-900 p-4 rounded-lg" ref={formRef} onPaste={handlePaste}>
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
            className="bg-gray-800 border border-gray-700 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-800 text-gray-100"
            required
          />
          <Input
            type="text"
            value={lenswareNumber}
            onChange={(e) => setLenswareNumber(e.target.value)}
            placeholder="Número de Lensware (opcional)"
            className="bg-gray-800 border border-gray-700 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-800 text-gray-100"
          />
          <Input
            type="file"
            onChange={handleFileChange}
            className="bg-gray-800 border border-gray-700 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-800 text-gray-100"
          />
          {pastedImagePreview && (
            <div className="mt-2">
              <p className="text-sm text-gray-300 mb-1">Imagen pegada:</p>
              <img src={pastedImagePreview} alt="Pasted" className="max-w-full h-auto" />
            </div>
          )}
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
        <CommerceJobTable 
          title={`Trabajos de ${activeTimeFrame}`} 
          jobs={sortedJobs}
          columns={COLUMNS}
        />
      </div>

      <SpreadsheetLink href={SPREADSHEET_URL} />
      <DriveFolderLink href={DRIVE_FOLDER_URL} />
    </div>
  )
}