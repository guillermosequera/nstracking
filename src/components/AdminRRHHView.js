import React, { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import JobTable from '@/components/JobTableObject'
import SpreadsheetLink from '@/components/SpreadsheetLink'
import AdminPageBase from '@/components/AdminPageBase'
import { sheetIds } from '@/config/roles'

const fetchSheetData = async (sheet) => {
  console.log(`Fetching data for sheet: ${sheet}`);
  try {
    const response = await fetch(`/api/fetchAllSheetData?sheet=${sheet}`);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log(`Received data for ${sheet}:`, data);
    return data;
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
}

export default function AdminRRHHView() {
  const [activeSheet, setActiveSheet] = useState(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { data: sheetData, isLoading, error } = useQuery({
    queryKey: ['sheetData', activeSheet],
    queryFn: () => activeSheet ? fetchSheetData(activeSheet) : null,
    enabled: !!activeSheet,
    retry: 3,
  })

  const filteredData = useMemo(() => {
    if (!sheetData) return [];
    let data = sheetData;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      data = data.filter(row => {
        const rowDate = new Date(row['Fecha y Hora'] || row[1]);
        return rowDate >= start && rowDate <= end;
      });
    }
    return data;
  }, [sheetData, startDate, endDate]);

  
  const columns = useMemo(() => {
    if (!sheetData || sheetData.length === 0) return []
    return Object.keys(sheetData[0])
  }, [sheetData])

  const dataCount = filteredData.length

  const userStats = useMemo(() => {
    const stats = {}
    filteredData.forEach(row => {
      const user = row['Usuario']
      if (user) {
        stats[user] = (stats[user] || 0) + 1
      }
    })
    return stats
  }, [filteredData])

  const renderSheetButtons = useCallback(() => (
    <div className="flex flex-wrap justify-center space-x-2 space-y-2 mb-6">
      {Object.keys(sheetIds).map(sheet => (
        <Button
          key={sheet}
          onClick={() => setActiveSheet(sheet)}
          variant={activeSheet === sheet ? "default" : "outline"}
          className={`transition-all duration-200 ${activeSheet === sheet ? "bg-blue-800 text-white" : "bg-gray-700 text-gray-400"}`}
        >
          {sheet}
        </Button>
      ))}
    </div>
  ), [activeSheet])

  const renderDateFilter = useCallback(() => (
    <div className="flex justify-center space-x-4 mb-6">
      <Input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="bg-gray-800 text-white"
      />
      <Input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        className="bg-gray-800 text-white"
      />
    </div>
  ), [startDate, endDate])

  const renderStats = useCallback(() => (
    <div className="mb-6">
      <h3 className="text-xl font-semibold mb-2">Estadísticas:</h3>
      <p>Total de registros: {dataCount}</p>
      <h4 className="text-lg font-semibold mt-2 mb-1">Registros por usuario:</h4>
      <ul>
        {Object.entries(userStats).map(([user, count]) => (
          <li key={user}>{user}: {count}</li>
        ))}
      </ul>
    </div>
  ), [dataCount, userStats])

  const content = (
    <div className="space-y-6 pb-16">
      {renderSheetButtons()}
      {activeSheet && (
        <>
          {renderDateFilter()}
          {renderStats()}
          {isLoading ? (
            <div className="text-center text-gray-300">Cargando datos...</div>
          ) : (
            <div className="overflow-x-auto bg-gray-900 rounded-lg shadow">
              <JobTable 
                title={`Datos de ${activeSheet}`} 
                jobs={filteredData} 
                columns={columns}
              />
            </div>
          )}
          {sheetIds[activeSheet] && (
            <SpreadsheetLink 
              href={`https://docs.google.com/spreadsheets/d/${sheetIds[activeSheet]}/edit#gid=0`}
            />
          )}
        </>
      )}

      {error && (
        <Alert variant="destructive" className="bg-red-900 border-red-700 text-red-100">
          <AlertDescription>{error.toString()}</AlertDescription>
        </Alert>
      )}
    </div>
  )

  return (
    <AdminPageBase title="Panel de Administración RRHH" role="adminRRHH">
      {content}
    </AdminPageBase>
  )
}