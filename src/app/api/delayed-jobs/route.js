import { google } from 'googleapis'
import { sheetIds } from '@/config/roles'
import { getAuthClient } from '@/utils/googleAuth'

export async function GET() {
  try {
    console.log('Iniciando GET delayed-jobs')
    
    const auth = await getAuthClient()
    const sheets = google.sheets({ version: 'v4', auth })
    
    // Obtener datos igual que en status/route.js
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetIds.status,
      range: 'A:E',
      valueRenderOption: 'FORMATTED_VALUE'
    })

    const rows = response.data.values || []
    console.log('Total de filas:', rows.length)
    
    // Agrupar por número de trabajo
    const jobsMap = new Map()
    
    rows.forEach(row => {
      if (!row[0]) return
      
      const jobNumber = row[0]
      if (!jobsMap.has(jobNumber)) {
        jobsMap.set(jobNumber, [])
      }
      jobsMap.get(jobNumber).push(row)
    })

    const delayedJobs = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    jobsMap.forEach((jobRows, jobNumber) => {
      // Verificar si NO tiene estado de despacho
      const hasDispatch = jobRows.some(row => 
        row[3]?.toLowerCase().includes('despacho')
      )
      
      if (!hasDispatch) {
        // Ordenar las filas por fecha como en status/route.js
        const sortedRows = jobRows.sort((a, b) => 
          new Date(a[1]) - new Date(b[1])
        )
        
        const firstRow = sortedRows[0]
        const firstDate = new Date(firstRow[1])
        firstDate.setHours(0, 0, 0, 0)
        
        const lastRow = sortedRows[sortedRows.length - 1]
        const lastDate = new Date(lastRow[1])
        lastDate.setHours(0, 0, 0, 0)
        
        const delayDays = Math.floor((lastDate - firstDate) / (1000 * 60 * 60 * 24))
        
        if (delayDays > 0) {
          // Obtener todas las filas para este trabajo
          const jobHistory = rows.filter(row => row[0] === jobNumber);
          
          // Ordenar el historial por fecha
          const sortedHistory = jobHistory.sort((a, b) => 
            new Date(a[1]) - new Date(b[1])
          );

          const firstEntry = sortedHistory[0];
          const lastEntry = sortedHistory[sortedHistory.length - 1];

          delayedJobs.push({
            id: jobNumber,
            number: jobNumber,
            entryDate: firstEntry[1],
            dueDate: lastEntry[1],
            area: lastEntry[2] || 'Sin área',
            lastStatus: lastEntry[3] || 'Sin estado',
            user: lastEntry[4] || 'No asignado',
            delayDays,
            // Agregamos el historial completo
            statuses: jobHistory  // Aquí está la clave del cambio
          });
        }
      }
    })

    delayedJobs.sort((a, b) => b.delayDays - a.delayDays)

    console.log(`Trabajos atrasados encontrados: ${delayedJobs.length}`)
    return Response.json(delayedJobs)

  } catch (error) {
    console.error('Error en delayed-jobs:', error)
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}