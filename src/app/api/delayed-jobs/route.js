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
      console.log(`\nAnalizando trabajo ${jobNumber}:`)
      
      // 1. Primera Verificación - Buscar estado "Digitación"
      const digitacionEntry = jobRows.find(row => row[3] === 'Digitación')
      
      if (!digitacionEntry) {
        console.log(`- Trabajo ${jobNumber}: No tiene estado "Digitación"`)
        return
      }

      // Verificar fecha de entrega en registro de Digitación
      const dueDate = digitacionEntry[5]
      if (!dueDate) {
        console.log(`- Trabajo ${jobNumber}: No tiene fecha de entrega en Digitación`)
        return
      }

      // 2. Segunda Verificación - Estado "En despacho"
      const hasDispatch = jobRows.some(row => row[3] === 'En despacho')
      if (hasDispatch) {
        console.log(`- Trabajo ${jobNumber}: Tiene estado "En despacho", se descarta`)
        return
      }

      // 3. Tercera Verificación - Cálculo de Atraso
      try {
        let parsedDueDate = new Date(dueDate)
        
        if (isNaN(parsedDueDate.getTime()) && dueDate.includes('/')) {
          const [day, month, year] = dueDate.split('/')
          parsedDueDate = new Date(year, month - 1, day)
        }
        
        parsedDueDate.setHours(0, 0, 0, 0)

        if (!isNaN(parsedDueDate.getTime())) {
          const delayDays = Math.ceil((today - parsedDueDate) / (1000 * 60 * 60 * 24))
          
          if (delayDays > 0) {
            console.log(`- Trabajo ${jobNumber} está atrasado ${delayDays} días`)
            
            // Obtener último estado
            const sortedRows = jobRows.sort((a, b) => new Date(b[1]) - new Date(a[1]))
            const lastEntry = sortedRows[0]

            delayedJobs.push({
              id: jobNumber,
              number: jobNumber,
              entryDate: digitacionEntry[1],
              dueDate: dueDate,
              area: lastEntry[2] || 'Sin área',
              lastStatus: lastEntry[3] || 'Sin estado',
              user: lastEntry[4] || 'No asignado',
              delayDays,
              statuses: jobRows
            })
          } else {
            console.log(`- Trabajo ${jobNumber} NO está atrasado (${delayDays} días)`)
          }
        } else {
          console.error(`- Fecha de entrega inválida para trabajo ${jobNumber}:`, dueDate)
        }
      } catch (error) {
        console.error(`Error procesando fecha para trabajo ${jobNumber}:`, {
          error: error.message,
          dueDate
        })
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