import { google } from 'googleapis'
import { sheetIds } from '@/config/roles'
import { getAuthClient } from '@/utils/googleAuth'

export async function GET() {
  try {
    console.log('Iniciando GET delayed-jobs')
    
    const auth = await getAuthClient()
    const sheets = google.sheets({ version: 'v4', auth })
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetIds.status,
      range: 'A:F',
      valueRenderOption: 'FORMATTED_VALUE'
    })

    const rows = response.data.values || []
    console.log('Total de filas:', rows.length)
    
    const jobsMap = new Map()
    
    // Agrupar por número de trabajo
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
      console.log(`Analizando trabajo ${jobNumber}:`)
      
      // Verificar si NO tiene estado de despacho
      const hasDispatch = jobRows.some(row => 
        row[3]?.toLowerCase().includes('despacho')
      )
      
      if (!hasDispatch) {
        // Ordenar las filas por fecha
        const sortedRows = jobRows.sort((a, b) => 
          new Date(a[1]) - new Date(b[1])
        )
        
        const firstEntry = sortedRows[0]
        const dueDate = firstEntry[5] // Fecha de entrega de la columna F

        // Validar y parsear la fecha de entrega
        let parsedDueDate
        try {
          // Verificar que dueDate existe y no está vacío
          if (!dueDate) {
            console.log(`Trabajo ${jobNumber}: Sin fecha de entrega`)
            return // Continuar con el siguiente trabajo
          }

          // Intentar diferentes formatos de fecha
          parsedDueDate = new Date(dueDate)
          
          // Si la fecha no es válida y tiene formato dd/mm/yyyy
          if (isNaN(parsedDueDate.getTime()) && dueDate.includes('/')) {
            const [day, month, year] = dueDate.split('/')
            parsedDueDate = new Date(year, month - 1, day)
          }
          
          parsedDueDate.setHours(0, 0, 0, 0)

          console.log(`Trabajo ${jobNumber}:`, {
            fechaEntrega: dueDate,
            fechaParseada: parsedDueDate,
            fechaHoy: today
          })

          if (!isNaN(parsedDueDate.getTime())) {
            const delayDays = Math.ceil((today - parsedDueDate) / (1000 * 60 * 60 * 24))
            
            if (delayDays > 0) {
              const lastEntry = sortedRows[sortedRows.length - 1]

              delayedJobs.push({
                id: jobNumber,
                number: jobNumber,
                entryDate: firstEntry[1],
                dueDate: dueDate,
                area: lastEntry[2] || 'Sin área',
                lastStatus: lastEntry[3] || 'Sin estado',
                user: lastEntry[4] || 'No asignado',
                delayDays,
                statuses: jobRows
              })
            }
          } else {
            console.error(`Fecha de entrega inválida para trabajo ${jobNumber}:`, dueDate)
          }
        } catch (error) {
          console.error(`Error procesando fecha para trabajo ${jobNumber}:`, {
            error: error.message,
            dueDate,
            firstEntry
          })
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