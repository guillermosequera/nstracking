// src/components/StatusView.js
'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchJobStatus } from '@/utils/jobUtils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDate } from '@/hooks/useDate'
import { DATE_FORMATS } from '@/hooks/useDate/constants'

const SEARCH_TYPES = {
  NV: {
    value: 'nv',
    label: 'NV',
    pattern: /^\d+$/,
    maxLength: 10,
    placeholder: 'Número de trabajo (8 o 10 dígitos)'
  },
  RUT: {
    value: 'rut',
    label: 'RUT',
    pattern: /^[\d.-]+$/,
    placeholder: 'Ingrese RUT'
  },
  NOMBRE: {
    value: 'nombre',
    label: 'NOMBRE',
    pattern: /^[a-zA-Z0-9\s]+$/,
    placeholder: 'Ingrese nombre'
  },
  OT: {
    value: 'ot',
    label: 'OT',
    pattern: /^[a-zA-Z0-9.-]+$/,
    placeholder: 'Ingrese OT'
  },
  OBSERVACION: {
    value: 'observacion',
    label: 'OBSERVACION',
    pattern: /^[a-zA-Z0-9.-\s]+$/,
    placeholder: 'Ingrese texto a buscar'
  }
};

export default function StatusView() {
  const [searchType, setSearchType] = useState(SEARCH_TYPES.NV.value)
  const [searchValue, setSearchValue] = useState('')
  const [expandedJob, setExpandedJob] = useState(null)
  const { parseDate, formatDate, toChileTime } = useDate()

  const { data: jobHistory, isLoading, error, refetch } = useQuery({
    queryKey: ['jobStatus', searchValue, searchType],
    queryFn: () => fetchJobStatus(searchValue, searchType),
    enabled: false,
    retry: 1,
    staleTime: 30000,
    cacheTime: 5 * 60 * 1000,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const currentType = SEARCH_TYPES[searchType.toUpperCase()]
    
    if (currentType.pattern.test(searchValue)) {
      if (searchType === 'nv' && (searchValue.length !== 8 && searchValue.length !== 10)) {
        return
      }
      await refetch()
    }
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    const currentType = SEARCH_TYPES[searchType.toUpperCase()]
    
    if (currentType.pattern.test(value) || value === '') {
      if (searchType === 'nv') {
        setSearchValue(value.slice(0, 10))
      } else {
        setSearchValue(value)
      }
    }
  }

  const formatDateDisplay = (dateString, includeTime = true) => {
    if (!dateString) return 'Fecha no disponible';
    
    const result = parseDate(dateString);
    if (result.error) return 'Fecha inválida';
    
    const chileDate = toChileTime(result.date);
    if (!chileDate) return 'Error de zona horaria';
    
    return formatDate(
      chileDate, 
      includeTime ? DATE_FORMATS.DISPLAY_WITH_TIME : DATE_FORMATS.DISPLAY_DATE_ONLY
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-6">Consulta de Estado</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <div className="relative">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="appearance-none w-[160px] bg-gray-100/80 border border-gray-300 text-gray-700 py-2 px-3 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
            >
              {Object.values(SEARCH_TYPES).map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
          
          <div className="flex-1">
            <Input
              type="text"
              value={searchValue}
              onChange={handleInputChange}
              placeholder={SEARCH_TYPES[searchType.toUpperCase()].placeholder}
              className="w-full bg-slate-200 border border-slate-300 text-slate-900"
            />
          </div>
          
          <Button 
            type="submit"
            variant="secondary"
            className="bg-gray-200 hover:bg-gray-300"
            disabled={isLoading || (searchType === 'nv' && searchValue.length !== 8 && searchValue.length !== 10)}
          >
            <Search className={`h-4 w-4 ${isLoading ? 'animate-spin duration-1000' : ''}`} />
            <span className="ml-2">Buscar</span>
          </Button>
        </div>
      </form>

      {error && (
        <Alert variant="destructive" className="mt-4 bg-red-50 border-red-200 text-red-900">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <AnimatePresence>
        {jobHistory && jobHistory.length > 0 && (
          <div className="mt-6 space-y-4">
            {jobHistory.map((job) => (
              <motion.div
                key={job.number}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className={`rounded-lg overflow-hidden shadow-lg ${
                  job.isCancelled ? 'bg-red-50' :
                  job.isDispatched ? 'bg-blue-50' : 'bg-slate-100'
                }`}
              >
                <div 
                  className={`p-4 cursor-pointer transition-colors ${
                    job.isCancelled ? 'hover:bg-red-100' :
                    job.isDispatched ? 'hover:bg-blue-100' : 'hover:bg-slate-200'
                  }`}
                  onClick={() => setExpandedJob(expandedJob === job.number ? null : job.number)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-medium ${
                        job.isCancelled ? 'text-red-900' :
                        job.isDispatched ? 'text-blue-900' : 'text-slate-900'
                      }`}>
                        {job.number}
                        {job.ot && (
                          <span className="ml-2 text-sm font-normal text-slate-600">
                            OT: {job.ot}
                          </span>
                        )}
                      </span>
                      {!job.isDispatched && !job.isCancelled && job.delayDays !== null && (
                        <Badge variant="secondary" className="bg-rose-900/70 text-yellow-500 border border-rose-800">
                          {job.delayDays > 0 ? `${job.delayDays} días de atraso` : 
                           job.delayDays < 0 ? `Entrega en ${Math.abs(job.delayDays)} días` : 
                           'Entrega hoy'}
                        </Badge>
                      )}
                    </div>
                    <Badge variant="secondary" className={`${
                      job.isCancelled ? 'bg-red-700 text-white border border-red-600' :
                      job.isDispatched ? 'bg-blue-700 text-white border border-blue-600' :
                      'bg-slate-700 text-white border border-slate-600'
                    }`}>
                      {job.historial[0]?.estado}
                    </Badge>
                  </div>
                  <div className="text-xs mt-2 flex justify-between text-slate-600">
                    <span>Ingreso: {formatDateDisplay(job.entryDate)}</span>
                    <div className="flex flex-col items-center">
                      {job.invoiceNumber && job.historial[0]?.estado === "Despachado" && (
                        <span className="mb-1 text-blue-600 font-medium">
                          Factura: {job.invoiceNumber}
                        </span>
                      )}
                      <span className={`${
                        job.isCancelled ? 'bg-red-700 border border-red-600' :
                        job.isDispatched ? 'bg-blue-700 border border-blue-600' :
                        'bg-slate-700 border border-slate-600'
                      } rounded-md px-2 py-1 text-white`}>
                        Fecha de entrega: {formatDateDisplay(job.dueDate)}
                      </span>
                    </div>
                    <span>Usuario: {job.historial[0]?.usuario}</span>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedJob === job.number && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="border-t border-slate-200">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Fecha y Hora
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Estado
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Usuario
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200">
                            {job.historial.map((entry, index) => (
                              <tr key={index} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                  {formatDateDisplay(entry.fecha)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <Badge variant="secondary" className="bg-slate-100 text-slate-800 border border-slate-200">
                                    {entry.estado}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                  {entry.usuario}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {jobHistory && jobHistory.length === 0 && (
        <Alert className="mt-4 bg-yellow-50 border-yellow-200 text-yellow-900">
          <AlertDescription>
            No se encontró información para la búsqueda: {searchValue}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
