'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchJobs, addDispatchJob, addJob } from '@/utils/jobUtils'
import { useJobErrors } from '@/hooks/useJobErrors'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useSession } from 'next-auth/react'
import { useTimeFrameData } from './TimeFrameSelector'
import SpreadsheetLink from './SpreadsheetLink'
import JobTable from './JobTable'
import TimeFrameSelector from './TimeFrameSelector'
import { sheetIds } from '@/config/roles'
import JobNumberInput from './JobNumberInput'
//import { useTheme } from 'next-themes'
import { jobQueue } from '@/utils/jobQueue'
import dispatchOptions from '@/data/dispatchOptions.json'
import Legend from '@/components/Legend'

const SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${sheetIds.workerDispatch}/edit#gid=0`
const COLUMNS = [
  { key: 'jobNumber', header: 'N° Orden' },
  { key: 'timestamp', header: 'Fecha y Hora' },
  { key: 'company', header: 'Empresa' },
  { key: 'client', header: 'Cliente' },
  { key: 'invoice', header: 'Factura' },
  { key: 'shippingCompany', header: 'Empresa de Envío' },
  { key: 'shippingOrder', header: 'Orden de Envío' },
  { key: 'user', header: 'Usuario' },
  { key: 'status', header: 'Estado' }
]

const ACTIVE_PAGE = 'workerDispatch'
const companyOptions = [
  { value: 'italoptic', label: 'Italoptic' },
  { value: 'trento', label: 'Trento' }
]
const shippingCompanyOptions = [
  { value: 'chilexpress', label: 'Chilexpress' },
  { value: 'correos', label: 'Correos de Chile' },
  { value: 'starken', label: 'Starken' },
  { value: 'otro', label: 'Otro' }
]
const LEGENDS = [
  { value: "00000001", standard: "Guías" },
  { value: "00000002", standard: "Armazones" },
  { value: "00000003", standard: "Estuches" },
  { value: "00000004", standard: "Cheques" },
  { value: "00000005", standard: "Publicidad" },
  { value: "00000006", standard: "Documentos" }
]

export default function WorkerDispatchView() {
  
  const [jobNumber, setJobNumber] = useState('')
  const [company, setCompany] = useState('')
  const [client, setClient] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [shippingCompany, setShippingCompany] = useState('')
  const [shippingOrder, setShippingOrder] = useState('')
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('Sin Asignar')
  const [queueStatus, setQueueStatus] = useState({ pending: 0, failed: 0 })
  
  const queryClient = useQueryClient()
  const { handleError, error, clearError } = useJobErrors()
  const { data: session } = useSession()

  const { data: allJobs = [], isLoading, refetch } = useQuery({
    queryKey: ['dispatch-jobs', selectedCompanyFilter],
    queryFn: async () => {
      console.log('Fetching jobs...');
      const data = await fetchJobs('all', 'workerDispatch', selectedCompanyFilter || '');
      return data;
    },
    retry: 3,
    onError: handleError,
    enabled: !!session?.user?.email,
    refetchOnWindowFocus: false,
    staleTime: 300000,
    cacheTime: 600000
  })

  const filteredJobs = useMemo(() => {
    if (!allJobs?.length) {
      console.log('No hay trabajos disponibles');
      return [];
    }

    console.log('Filtrando trabajos:', allJobs.length);

    return allJobs
      .filter(job => {
        if (!job || !Array.isArray(job)) return false;
        const companyValue = job[2];
        return selectedCompanyFilter === 'Sin Asignar' 
          ? !companyValue || companyValue === 'Sin Asignar'
          : companyValue === selectedCompanyFilter;
      })
      .map(job => ({
        jobNumber: job[0],
        timestamp: job[1],
        timestampFormatted: new Date(job[1]).toLocaleString('es-ES', {
          dateStyle: 'medium',
          timeStyle: 'medium'
        }),
        company: job[2] || 'Sin Asignar',
        client: job[3] || '',
        invoice: job[4] || '',
        shippingCompany: job[5] || '',
        shippingOrder: job[6] || '',
        user: job[7] || '',
        status: job[8] || 'En despacho'
      }));
  }, [allJobs, selectedCompanyFilter]);

  useEffect(() => {
    if (allJobs?.length > 0) {
      console.log('Datos iniciales cargados:', allJobs.length);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const interval = setInterval(() => {
      if (!mounted) return;
      
      const status = jobQueue.getStatus();
      if (JSON.stringify(status) !== JSON.stringify(queueStatus)) {
        setQueueStatus(status);
        
        if (status.pending === 0 && queueStatus.pending > 0) {
          refetch();
        }
      }
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [queueStatus, refetch]);

  const resetForm = () => {
    setJobNumber('')
    setCompany('')
    setClient('')
    setInvoiceNumber('')
    setShippingCompany('')
    setShippingOrder('')
  }

  const handleSubmit = useCallback((jobNumberValue) => {
    try {
      const jobData = {
        jobNumber: jobNumberValue,
        timestamp: new Date().toISOString(),
        company: company || 'Sin Asignar',
        client: client || '',
        invoiceNumber: invoiceNumber || '',
        shippingCompany: shippingCompany || '',
        shippingOrder: shippingOrder || '',
        userEmail: session?.user?.email,
        status: company ? 'Salida despacho' : 'En despacho',
        role: 'workerDispatch',
      }
      
      jobQueue.add(jobData)
      resetForm()
      clearError()
    } catch (error) {
      handleError(error)
    }
  }, [company, client, invoiceNumber, shippingCompany, shippingOrder, session?.user?.email, clearError, handleError])

  const renderFormFields = () => {
    if (!company) return null

    const commonClasses = "w-full max-w-xs mx-auto text-sm"

    if (company === 'italoptic') {
      return (
        <div className="space-y-2 w-full max-w-md mx-auto">
          <Select
            value={client}
            onValueChange={setClient}
            options={dispatchOptions.clientOptions}
            placeholder="Seleccione cliente"
            className={commonClasses}
          />
          <Input
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="Número de factura"
            className={commonClasses}
          />
          <Select
            value={shippingCompany}
            onValueChange={setShippingCompany}
            options={shippingCompanyOptions}
            placeholder="Seleccione empresa de envío"
            className={commonClasses}
          />
          <Input
            type="text"
            value={shippingOrder}
            onChange={(e) => setShippingOrder(e.target.value)}
            placeholder="Orden de envío"
            className={commonClasses}
          />
        </div>
      )
    }

    if (company === 'trento') {
      return (
        <div className="w-full max-w-md mx-auto">
          <Select
            value={invoiceNumber}
            onValueChange={setInvoiceNumber}
            options={dispatchOptions.agreementOptions}
            placeholder="Seleccione el convenio"
            className={commonClasses}
          />
        </div>
      )
    }

    return null
  }

  const handleCompanyFilterChange = (value) => {
    if (value === '') {
      setSelectedCompanyFilter('Sin Asignar');
    } else {
      setSelectedCompanyFilter(value);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="space-y-4 bg-gray-200 p-4 rounded-lg">
        <JobNumberInput
          jobNumber={jobNumber}
          setJobNumber={setJobNumber}
          isLoading={false}
          onSubmit={handleSubmit}
          hideStatusSelector={true}
        />

        <Select
          value={company}
          onValueChange={setCompany}
          options={companyOptions}
          placeholder="Seleccione la empresa (opcional)"
          className="w-full max-w-xs mx-auto text-sm bg-slate-200 text-slate-900"
        />

        {renderFormFields()}
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-900 border-red-700 text-red-100">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center space-x-4">
        <Button
          onClick={() => handleCompanyFilterChange('')}
          variant={selectedCompanyFilter === 'Sin Asignar' ? "default" : "outline"}
          className={selectedCompanyFilter === 'Sin Asignar' ? "bg-blue-800" : ""}
        >
          En Despacho
        </Button>
        {companyOptions.map(({ value, label }) => (
          <Button
            key={value}
            onClick={() => handleCompanyFilterChange(value)}
            variant={selectedCompanyFilter === value ? "default" : "outline"}
            className={selectedCompanyFilter === value ? "bg-blue-800" : ""}
          >
            {label}
          </Button>
        ))}
      </div>

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
        title="Trabajos de Despacho"
        jobs={filteredJobs}
        columns={COLUMNS}
        enableScroll={true}
        role="workerDispatch"
        onError={handleError}
        onRefresh={() => {
          console.log('Actualizando datos manualmente...');
          refetch();
        }}
        isLoading={isLoading}
        pendingJobs={queueStatus.pending}
      />

      <Legend legends={LEGENDS} />
      <SpreadsheetLink href={SPREADSHEET_URL} />
    </div>
  )
}