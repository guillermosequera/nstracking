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
  const [searchTrigger, setSearchTrigger] = useState(false)

  const { data: jobHistory, isLoading, error, refetch } = useQuery({
    queryKey: ['jobStatus', jobNumber],
    queryFn: () => fetchJobStatus(jobNumber),
    enabled: searchTrigger && jobNumber.length > 0,
    retry: 1
  })

  const sortedJobHistory = useMemo(() => {
    if (!jobHistory) return [];
    return [...jobHistory].sort((a, b) => new Date(b[1]) - new Date(a[1]));
  }, [jobHistory]);

  const handleSubmit = (e) => {
    e.preventDefault()
    setSearchTrigger(true)
    refetch()
  }

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10)
    setJobNumber(value)
    setSearchTrigger(false)
  }

  return (
    <div className="space-y-6 pb-16">
      <form onSubmit={handleSubmit} className="flex justify-center">
        <div className="flex items-center w-full max-w-md">
          <input
            type="text"
            value={jobNumber}
            onChange={handleInputChange}
            placeholder="Número de trabajo (8 o 10 dígitos)"
            className="flex-grow bg-gray-800 border border-gray-700 rounded-l p-2 focus:outline-none focus:ring-2 focus:ring-blue-800 text-gray-100"
            aria-label="Ingrese número de trabajo"
          />
          <Button 
            type="submit" 
            className="bg-blue-800 text-white rounded-r hover:bg-blue-700 transition duration-200 disabled:bg-gray-600"
            disabled={jobNumber.length !== 8 && jobNumber.length !== 10}
          >
            Buscar
          </Button>
        </div>
      </form>

      {isLoading && <div className="text-center text-gray-300">Cargando...</div>}

      {error && (
        <Alert variant="destructive" className="bg-red-900 border-red-700 text-red-100">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {sortedJobHistory && sortedJobHistory.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-center">Historial del trabajo {jobNumber}</h2>
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-blue-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Fecha y Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Área</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Usuario</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {sortedJobHistory.map((entry, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-850' : 'bg-gray-800'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(entry[1]).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{entry[2]}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <Badge variant="secondary" className="bg-blue-800 text-white">
                        {entry[3]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{entry[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {jobHistory && jobHistory.length === 0 && searchTrigger && (
        <Alert className="bg-yellow-900 border-yellow-700 text-yellow-100">
          <AlertDescription>No se encontró información para el trabajo {jobNumber}.</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
