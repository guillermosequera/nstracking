import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchQualityJobs, addQualityJob } from '@/utils/jobUtils'
import { useJobErrors } from '@/hooks/useJobErrors'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useSession } from 'next-auth/react'
import MultipleSpreadsheetLinks from './MultipleSpreadsheetLinks'
import JobTable from './JobTable'
import TimeFrameSelector from './TimeFrameSelector'

const SPREADSHEET_URLS = {
    quality: 'https://docs.google.com/spreadsheets/d/1Rw9dCjrLt0jDf9j8UgI0Jxoo9APGJzj-qqEXNBYxO3U/edit?gid=0#gid=0',
    merma: 'https://docs.google.com/spreadsheets/d/16YgBjf0WGWuZ6rddZtfm_OmelbZpmuTL7Js3Vmww5S8/edit?gid=0#gid=0',
    garantia: 'https://docs.google.com/spreadsheets/d/1mA24Oz7umBTuUvAk5s4q-ObAb2Kqf8031LIA4NpCI4w/edit?gid=0#gid=0'
  }
const COLUMNS = ['Número de Trabajo', 'Fecha y Hora', 'Responsable', 'Tipo de Control', 'Resultado', 'Notas']
const ACTIVE_PAGE = 'quality'

const controlTypes = [
  { value: 'fuera_de_control_de_calidad', label: 'Despacho' },
  { value: 'garantia_en_proceso', label: 'Garantia' },
  { value: 'merma_bodega', label: 'Merma Bodega' },
  { value: 'merma_comercial', label: 'Merma Comercial' },
  { value: 'merma_laboratorio', label: 'Merma Laboratorio' },
  { value: 'merma_montaje', label: 'Merma Montaje' },
  { value: 'merma_proveedor', label: 'Merma Proveedor' },
  { value: 'enviado_a_superficie', label: 'Superficie' },
]

const resultOptions = {
  fuera_de_control_de_calidad: [
    { value: 'aprobado', label: 'Aprobado' },
    { value: 'autorizado', label: 'Autorizado' },
  ],
  garantia_en_proceso: [
    { value: 'capa', label: 'Capa' },
    { value: 'poro', label: 'Poro' },
    { value: 'rayado', label: 'Rayado' },
    { value: 'armazon', label: 'Armazon' },
    { value: 'rectificacion', label: 'Rectificacion' },
    { value: 'traspaso', label: 'Traspaso' },
    { value: 'tamaño', label: 'Tamaño' },
    { value: 'error digitacion', label: 'Error digitacion' },
    { value: 'error de base', label: 'Error de base' },
    { value: 'fuerza erronea', label: 'Fuerza erronea' },
    { value: 'extravio', label: 'Extravio' },
    { value: 'maquina', label: 'Maquina' },
  ],
  merma_bodega: [
    { value: 'fuerza erronea', label: 'Fuerza erronea' },
    { value: 'error de base', label: 'Error de base' },
    { value: 'armazon', label: 'Armazon' },
  ],
  merma_comercial: [
    { value: 'fuerza erronea', label: 'Fuerza erronea' },
    { value: 'error digitacion', label: 'Error digitacion' },
    { value: 'error trazado', label: 'Error trazado' },
  ],
  merma_laboratorio: [
    { value: 'capa', label: 'Capa' },
    { value: 'poro', label: 'Poro' },
    { value: 'rayado', label: 'Rayado' },
    { value: 'error de base', label: 'Error de base' },
    { value: 'fuerza erronea', label: 'Fuerza erronea' },
    { value: 'extravio', label: 'Extravio' },
    { value: 'diferente adicion', label: 'Diferencia adicion' },
  ],
  merma_montaje: [
    { value: 'rayado', label: 'Rayado' },
    { value: 'maquina', label: 'Maquina' },
    { value: 'tamaño', label: 'Tamaño' },
    { value: 'armazon', label: 'Armazon' },
    { value: 'reparacion', label: 'Reparacion' },
  ],
  merma_proveedor: [
    { value: 'error de base', label: 'Error de base' },
    { value: 'fuerza erronea', label: 'Fuerza erronea' },
    { value: 'poro', label: 'Poro' },
    { value: 'rayado', label: 'Rayado' },
  ],
  enviado_a_superficie: [
    { value: 'fuerza erronea', label: 'Fuerza erronea' },
    { value: 'poro', label: 'Poro' },
    { value: 'rayado', label: 'Rayado' },
  ],
}

const sheetOptions = [
    { value: 'quality', label: 'Control de Calidad' },
    { value: 'merma', label: 'Mermas' },
    { value: 'garantia', label: 'Garantías' },
  ]

  export default function WorkerQualityView() {
    const [jobNumber, setJobNumber] = useState('')
    const [controlType, setControlType] = useState('')
    const [result, setResult] = useState('')
    const [notes, setNotes] = useState('')
    const [activeTimeFrame, setActiveTimeFrame] = useState('today')
    const [selectedSheet, setSelectedSheet] = useState('quality')
    const queryClient = useQueryClient()
    const { handleError, error, clearError } = useJobErrors()
    const { data: session } = useSession()

    const { data: jobs, isLoading, refetch } = useQuery({
        queryKey: ['quality-jobs', activeTimeFrame, selectedSheet],
        queryFn: () => fetchQualityJobs(activeTimeFrame, selectedSheet),
        retry: 3,
        onError: handleError
    })

  const addJobMutation = useMutation({
    mutationFn: (jobData) => addQualityJob(jobData, session?.user?.email),
    onSuccess: () => {
      refetch()
      resetForm()
      clearError()
    },
    onError: handleError
  })

  const resetForm = () => {
    setJobNumber('')
    setNotes('')
    // No reseteamos controlType ni result
  }

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    if (jobNumber.length !== 8 && jobNumber.length !== 10) return
    
    const selectedControl = controlTypes.find(ct => ct.value === controlType)
    let targetSheet = 'quality'
    if (selectedControl.value.startsWith('merma_')) {
      targetSheet = 'merma'
    } else if (selectedControl.value === 'garantia_en_proceso') {
      targetSheet = 'garantia'
    }
  
    addJobMutation.mutate({ 
        jobNumber, 
        controlType, 
        result, 
        notes, 
        targetSheet,
        status: selectedControl.value
      })
    }, [jobNumber, controlType, result, notes, addJobMutation])


  const handleControlTypeChange = (value) => {
    setControlType(value)
    setResult('')  // Reset result when control type changes
  }

  const handleJobNumberChange = (e) => {
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
            className="bg-blue-800 text-white rounded-r hover:bg-blue-700 transition duration-200 disabled:bg-gray-600"
            disabled={addJobMutation.isLoading || (jobNumber.length !== 8 && jobNumber.length !== 10) || !controlType || !result}
          >
            {addJobMutation.isLoading ? 'Agregando...' : 'Agregar'}
          </Button>
        </div>
        <Select
          value={controlType}
          onValueChange={handleControlTypeChange}
          options={controlTypes}
          placeholder="Seleccione el tipo de control"
        />
        {controlType && (
          <Select
            value={result}
            onValueChange={setResult}
            options={resultOptions[controlType]}
            placeholder="Seleccione el resultado"
          />
        )}
        <Input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas adicionales"
        />
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

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {sheetOptions.map(({ value, label }) => (
            <Button
              key={value}
              onClick={() => setSelectedSheet(value)}
              variant={selectedSheet === value ? "default" : "outline"}
              className={`transition-all duration-200 ${selectedSheet === value ? "bg-blue-800 text-white" : "bg-gray-700 text-gray-400"}`}
            >
              {label}
            </Button>
          ))}
        </div>

        <TimeFrameSelector activeTimeFrame={activeTimeFrame} setActiveTimeFrame={setActiveTimeFrame} />
      </div>

      <JobTable 
        title={`Trabajos de ${sheetOptions.find(so => so.value === selectedSheet).label} - ${activeTimeFrame}`} 
        jobs={sortedJobs} 
        columns={COLUMNS}
      />

        <MultipleSpreadsheetLinks urls={SPREADSHEET_URLS} selectedSheet={selectedSheet} />
    </div>
  )
}