// src/components/StatusView.js
'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchJobStatus } from '@/utils/jobUtils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'

export default function StatusView() {
  const [jobNumber, setJobNumber] = useState('')

  const { data: jobHistory, isLoading, error, refetch } = useQuery({
    queryKey: ['jobStatus', jobNumber],
    queryFn: () => fetchJobStatus(jobNumber),
    enabled: false,
    retry: 1,
    staleTime: 30000,
    cacheTime: 5 * 60 * 1000,
  })

  const sortedJobHistory = useMemo(() => {
    if (!jobHistory) return [];
    return [...jobHistory].sort((a, b) => new Date(b[1]) - new Date(a[1]));
  }, [jobHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (jobNumber.length === 8 || jobNumber.length === 10) {
      await refetch()
    }
  }

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10)
    setJobNumber(value)
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Consulta de Estado</h1>
      </div>

      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="flex justify-center ">
          <div className="flex items-center w-full max-w-md">
            <input
              type="text"
              value={jobNumber}
              onChange={handleInputChange}
              placeholder="Número de trabajo (8 o 10 dígitos)"
              className="flex-grow bg-slate-200 border border-slate-200 shadow-xl rounded-l p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400"
              aria-label="Ingrese número de trabajo"
            />
            <Button 
              type="submit" 
              className="bg-blue-600 text-white shadow-xl rounded-r hover:bg-blue-700 transition duration-200 disabled:bg-slate-400"
              disabled={isLoading || (jobNumber.length !== 8 && jobNumber.length !== 10)}
            >
              {isLoading ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        </form>

        {isLoading && (
          <div className="text-center text-slate-700">
            Cargando...
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        {sortedJobHistory && sortedJobHistory.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-center text-slate-900">
              Historial del trabajo {jobNumber}
            </h2>
            <div className="bg-slate-200 rounded-lg overflow-hidden shadow-2xl">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-300">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Fecha y Hora
                    </th>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Área
                    </th> */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Usuario
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {sortedJobHistory.map((entry, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {new Date(entry[1]).toLocaleString()}
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {entry[2]}
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Badge variant="secondary" className="bg-slate-400 text-slate-800 border border-slate-200">
                          {entry[3]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {entry[4]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {jobHistory && jobHistory.length === 0 && (
          <Alert className="bg-yellow-50 border-yellow-200 text-yellow-900">
            <AlertDescription>
              No se encontró información para el trabajo {jobNumber}.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
