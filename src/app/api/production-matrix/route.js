import { google } from 'googleapis'
import { sheetIds } from '@/config/roles'
import { getAuthClient } from '@/utils/googleAuth'

export async function GET(request) {
  try {
    const auth = await getAuthClient()
    const sheets = google.sheets({ version: 'v4', auth })
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetIds.status,
      range: 'A:H',
      valueRenderOption: 'FORMATTED_VALUE'
    })

    const rows = response.data.values || []
    
    // Estructura para almacenar los datos de la matriz
    const matrix = {
      delayOver10: {},    // atraso > 10 días
      delayOver6: {},     // atraso > 6 días
      delayOver2: {},     // atraso > 2 días
      delay1: {},         // atraso 1 día
      dueToday: {},       // entrega hoy
      dueTomorrow: {},    // entrega mañana
      dueOver4: {},       // entrega > 4 días
      totals: {}          // totales por estado
    }

    // Procesar las filas y agrupar por estado y días
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const jobsMap = new Map()
    
    // Primero agrupamos por número de trabajo para obtener el último estado
    rows.forEach(row => {
      if (!row[0]) return
      const [jobNumber, dateStr, area, status, user] = row
      
      if (!jobsMap.has(jobNumber)) {
        jobsMap.set(jobNumber, [])
      }
      jobsMap.get(jobNumber).push(row)
    })

    // Procesar cada trabajo
    jobsMap.forEach((jobRows, jobNumber) => {
      // Ordenar por fecha para obtener el último estado
      const sortedRows = jobRows.sort((a, b) => 
        new Date(b[1]) - new Date(a[1])
      )

      const lastEntry = sortedRows[0]
      const firstEntry = sortedRows[sortedRows.length - 1]
      const status = lastEntry[3]
      
      const firstDate = new Date(firstEntry[1])
      firstDate.setHours(0, 0, 0, 0)
      
      const daysDiff = Math.floor(
        (today - firstDate) / (1000 * 60 * 60 * 24)
      )

      // Inicializar contadores si no existen
      const initializeCounter = (obj, status) => {
        if (!obj[status]) {
          obj[status] = {
            count: 0,
            jobs: []
          }
        }
      }

      // Función para agregar trabajo a la categoría correspondiente
      const addToCategory = (category, status, jobData) => {
        initializeCounter(category, status)
        category[status].count++
        category[status].jobs.push({
          number: jobNumber,
          status,
          delayDays: daysDiff,
          lastUpdate: lastEntry[1],
          area: lastEntry[2],
          user: lastEntry[4],
          history: sortedRows
        })
      }

      // Clasificar el trabajo según los días
      if (daysDiff > 10) {
        addToCategory(matrix.delayOver10, status, jobRows)
      } else if (daysDiff > 6) {
        addToCategory(matrix.delayOver6, status, jobRows)
      } else if (daysDiff > 2) {
        addToCategory(matrix.delayOver2, status, jobRows)
      } else if (daysDiff === 1) {
        addToCategory(matrix.delay1, status, jobRows)
      } else if (daysDiff === 0) {
        addToCategory(matrix.dueToday, status, jobRows)
      } else if (daysDiff === -1) {
        addToCategory(matrix.dueTomorrow, status, jobRows)
      } else if (daysDiff < -4) {
        addToCategory(matrix.dueOver4, status, jobRows)
      }

      // Actualizar totales
      initializeCounter(matrix.totals, status)
      matrix.totals[status].count++
    })

    return Response.json(matrix)

  } catch (error) {
    console.error('Error en production-matrix:', error)
    return Response.json(
      { error: 'Error al procesar la matriz de producción' },
      { status: 500 }
    )
  }
} 