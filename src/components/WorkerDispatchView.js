'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJobs, addDispatchJob } from '@/utils/jobUtils'
import { useJobErrors } from '@/hooks/useJobErrors'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useSession } from 'next-auth/react'
import SpreadsheetLink from './SpreadsheetLink'
import JobTable from './JobTable'
import dispatchOptions from '@/data/dispatchOptions.json'

const ACTIVE_PAGE = 'dispatch'
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1i4p-uWu1e6aniq-Vbq-RDciVqDZJqM4lSMd1Uv4Dp-o/edit?gid=0#gid=0'

const timeFrames = [
  { key: 'today', label: 'Hoy' },
  { key: 'yesterday', label: 'Ayer' },
  { key: 'twoDaysAgo', label: 'Antes de Ayer' },
  { key: 'week', label: 'Esta Semana' },
  { key: 'month', label: 'Este Mes' },
  { key: 'lastMonth', label: 'Mes Pasado' }
]

const companyOptions = [
  { value: 'todos', label: 'Todos' },
  { value: 'trento', label: 'Trento' },
  { value: 'italoptic', label: 'Italoptic' },
]

const shippingCompanyOptions = [
  { value: 'OF. VARMONTT', label: 'OF. VARMONTT' },
  { value: 'STARKEN', label: 'STARKEN' },
  { value: 'LEMONDECARGO', label: 'LEMONDECARGO' },
  { value: 'CHILEEXPRESS', label: 'CHILEEXPRESS' },
  { value: 'CORREOS DE CHILE', label: 'CORREOS DE CHILE' },
  { value: 'ESPECIFICAR', label: 'EXCEPCION' },
]

const validationRules = {
  'OF. VARMONTT': /^\d{7}$/,
  'STARKEN': /^\d{9}$/,
  'LEMONDECARGO': /^\d{6}$/,
  'CHILEEXPRESS': /^\d{12}$/,
  'CORREOS DE CHILE': /^\d{9}$/,
  'ESPECIFICAR': /^[a-z0-9]+$/
}

const shippingOrderPlaceholders = {
  'OF. VARMONTT': '7 dígitos',
  'STARKEN': '9 dígitos',
  'LEMONDECARGO': '6 dígitos',
  'CHILEEXPRESS': '12 dígitos',
  'CORREOS DE CHILE': '9 dígitos',
  'ESPECIFICAR': 'Ingrese la orden de envío'
}

export default function WorkerDispatchView() {
  const [jobNumber, setJobNumber] = useState('')
  const [company, setCompany] = useState('')
  const [agreement, setAgreement] = useState('')
  const [client, setClient] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [shippingCompany, setShippingCompany] = useState('')
  const [shippingOrder, setShippingOrder] = useState('')
  const [activeTimeFrame, setActiveTimeFrame] = useState('today')
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('todos')
  const queryClient = useQueryClient()
  const { handleError, error, clearError } = useJobErrors()
  const { data: session } = useSession()

  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['jobs', activeTimeFrame, 'dispatch', selectedCompanyFilter],
    queryFn: () => fetchJobs(activeTimeFrame, 'workerDispatch', selectedCompanyFilter),
    retry: 3,
    onError: handleError
  })

  const addJobMutation = useMutation({
    mutationFn: (jobData) => addDispatchJob(jobData, session.user.email),
    onSuccess: () => {
      refetch()
      resetForm()
      clearError()
    },
    onError: handleError
  })

  const resetForm = () => {
    setJobNumber('')
    setCompany('')
    setAgreement('')
    setClient('')
    setInvoiceNumber('')
    setShippingCompany('')
    setShippingOrder('')
  }

  const isShippingOrderValid = useCallback(() => {
    if (!shippingCompany || !shippingOrder) return false
    return validationRules[shippingCompany].test(shippingOrder)
  }, [shippingCompany, shippingOrder])

  const isFormValid = useCallback(() => {
    const conditions = [
      jobNumber.length === 8 || jobNumber.length === 10,
      company
    ]
    const companySpecificConditions = {
      'trento': () => !!agreement,
      'italoptic': () => client && invoiceNumber && shippingCompany && isShippingOrderValid()
    }
    if (companySpecificConditions[company]) {
      conditions.push(companySpecificConditions[company]())
    }
    return conditions.every(Boolean)
  }, [jobNumber, company, agreement, client, invoiceNumber, shippingCompany, isShippingOrderValid])

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    if (!isFormValid()) return

    let jobData = {
      jobNumber,
      company,
      ...(company === 'trento' 
        ? { agreement }
        : {
            client,
            invoiceNumber,
            shippingCompany,
            shippingOrder
          })
    }

    addJobMutation.mutate(jobData)
  }, [jobNumber, company, agreement, client, invoiceNumber, shippingCompany, shippingOrder, isFormValid, addJobMutation])

  const handleJobNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10)
    setJobNumber(value)
  }

  const sortedJobs = useMemo(() => {
    if (!jobs) return []
    return [...jobs].sort((a, b) => new Date(b[1]) - new Date(a[1]))
  }, [jobs])

  const filteredJobs = useMemo(() => {
    if (selectedCompanyFilter === 'todos') return sortedJobs
    return sortedJobs.filter(job => job[2] === selectedCompanyFilter)
  }, [sortedJobs, selectedCompanyFilter])

  const completedJobsCount = filteredJobs.length

  useEffect(() => {
    if (shippingCompany === 'ESPECIFICAR') {
      setShippingOrder('')
    }
  }, [shippingCompany])

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
          <button 
            type="submit" 
            className="bg-blue-800 text-white px-4 py-2 rounded-r hover:bg-blue-700 transition duration-200 disabled:bg-gray-600"
            disabled={addJobMutation.isLoading || !isFormValid()}
          >
            {addJobMutation.isLoading ? 'Agregando...' : 'Agregar'}
          </button>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Select
            value={company}
            onValueChange={setCompany}
            options={companyOptions.filter(opt => opt.value !== 'todos')}
            placeholder="Seleccione la empresa"
          />
          {company === 'trento' && (
            <Select
              value={agreement}
              onValueChange={setAgreement}
              options={dispatchOptions.agreementOptions}
              placeholder="Seleccione el tipo de convenio"
            />
          )}
          {company === 'italoptic' && (
            <>
              <Select
                value={client}
                onValueChange={setClient}
                options={dispatchOptions.clientOptions}
                placeholder="Seleccione el cliente"
              />
              <Input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Número de factura"
              />
              <Select
                value={shippingCompany}
                onValueChange={setShippingCompany}
                options={shippingCompanyOptions}
                placeholder="Seleccione la empresa de envío"
              />
              <Input
                type="text"
                value={shippingOrder}
                onChange={(e) => setShippingOrder(e.target.value.toLowerCase())}
                placeholder={shippingOrderPlaceholders[shippingCompany] || "Orden de envío"}
                className={`bg-gray-800 border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-800 text-gray-100 ${
                  shippingCompany && shippingOrder
                    ? isShippingOrderValid()
                      ? 'border-green-500'
                      : 'border-red-500'
                    : 'border-gray-700'
                }`}
              />
            </>
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

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 justify-center">
          <div className="flex gap-2">
            {companyOptions.map(({ value, label }) => (
              <Button
                key={value}
                onClick={() => setSelectedCompanyFilter(value)}
                variant={selectedCompanyFilter === value ? "default" : "outline"}
                className={`transition-all duration-200 ${selectedCompanyFilter === value ? "bg-blue-800 text-white" : "bg-gray-700 text-gray-400"}`}
              >
                {label}
              </Button>
            ))}
          </div>
          {timeFrames.map(({ key, label }) => (
            <Button
              key={key}
              onClick={() => setActiveTimeFrame(key)}
              variant={activeTimeFrame === key ? "default" : "outline"}
              className={`transition-all duration-200 ${activeTimeFrame === key ? "bg-blue-800 text-white" : "bg-gray-700 text-gray-400"}`}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="overflow-x-auto bg-gray-900 rounded-lg shadow">
          <JobTable 
            title={`Trabajos de ${timeFrames.find(tf => tf.key === activeTimeFrame).label}`} 
            jobs={filteredJobs} 
            columns={['Número de Trabajo', 'Fecha y Hora', 'Empresa', 'Cliente/Convenio', 'Factura', 'Empresa de Envío', 'Orden de Envío', 'Usuario']}
          />
        </div>
      </div>

      <SpreadsheetLink href={SPREADSHEET_URL} />
    </div>
  )
}