'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import DataTable from '@/components/DataTable'
import { useSession } from 'next-auth/react'
import { isAdminRRHH } from '@/utils/adminRRHHAuth'

const SHEETS = [
  'warehouse', 'commerce', 'quality', 'labs', 'montage', 'dispatch', 'status'
]

const fetchAllSheetData = async () => {
    const response = await fetch('/api/fetchAllSheetData');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  };

export default function AdminRRHHView() {
    const { data: session } = useSession()
    const [activeView, setActiveView] = useState(null)
    const [activeSheet, setActiveSheet] = useState(null)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (!isAdminRRHH(session)) {
      console.error('Unauthorized access to AdminRRHHView');
      // You might want to redirect here or show an error message
    }
  }, [session]);

  const { data: allSheetData, isLoading, error } = useQuery({
    queryKey: ['allSheetData'],
    queryFn: fetchAllSheetData,
    enabled: activeView === 'viewData' && isAdminRRHH(session)
  })

  const filteredData = activeSheet && allSheetData && allSheetData[activeSheet] ? 
    allSheetData[activeSheet].filter(row => {
      const rowDate = new Date(row[1]) // Asumiendo que la fecha está en la segunda columna
      return (!startDate || rowDate >= new Date(startDate)) &&
             (!endDate || rowDate <= new Date(endDate))
    }) : []

  const handleViewChange = (view) => {
    setActiveView(view)
    setActiveSheet(null)
  }

  const handleSheetChange = (sheet) => {
    setActiveSheet(sheet)
  }

  if (!isAdminRRHH(session)) {
    return <div>Acceso no autorizado</div>;
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex justify-center space-x-4">
        <Button 
          onClick={() => handleViewChange('viewData')}
          variant={activeView === 'viewData' ? "default" : "outline"}
        >
          Ver datos
        </Button>
        <Button 
          onClick={() => handleViewChange('serviceLevel')}
          variant={activeView === 'serviceLevel' ? "default" : "outline"}
        >
          Nivel de servicio
        </Button>
        <Button 
          onClick={() => handleViewChange('scraps')}
          variant={activeView === 'scraps' ? "default" : "outline"}
        >
          Porcentaje de Mermas
        </Button>
        <Button 
          onClick={() => handleViewChange('delayedDays')}
          variant={activeView === 'delayedDays' ? "default" : "outline"}
        >
          Días atrasados
        </Button>
      </div>

      {activeView === 'viewData' && (
        <div className="space-y-4">
          <div className="flex justify-center space-x-2">
            {SHEETS.map(sheet => (
              <Button 
                key={sheet}
                onClick={() => handleSheetChange(sheet)}
                variant={activeSheet === sheet ? "default" : "outline"}
              >
                {sheet.charAt(0).toUpperCase() + sheet.slice(1)}
              </Button>
            ))}
          </div>

          {activeSheet && (
            <div className="space-y-4">
              <div className="flex justify-center space-x-4">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Fecha de inicio"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="Fecha de fin"
                />
              </div>

              <div className="text-center">
                <p>Total de trabajos: {filteredData.length}</p>
                {startDate && endDate && (
                  <p>
                    Mostrando datos desde {format(new Date(startDate), 'dd/MM/yyyy')} 
                    hasta {format(new Date(endDate), 'dd/MM/yyyy')}
                  </p>
                )}
              </div>

              {isLoading ? (
                <p className="text-center">Cargando datos...</p>
              ) : error ? (
                <p className="text-center text-red-500">Error al cargar los datos: {error.message}</p>
              ) : (
                <DataTable data={filteredData} />
              )}
            </div>
          )}
        </div>
      )}

      {activeView === 'serviceLevel' && <p className="text-center">Funcionalidad de Nivel de Servicio aún no implementada</p>}
      {activeView === 'scraps' && <p className="text-center">Funcionalidad de Porcentaje de Mermas aún no implementada</p>}
      {activeView === 'delayedDays' && <p className="text-center">Funcionalidad de Días Atrasados aún no implementada</p>}
    </div>
  )
}