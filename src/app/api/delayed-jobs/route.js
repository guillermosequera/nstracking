import { google } from 'googleapis'
import { sheetIds } from '@/config/roles'
import { getAuthClient } from '@/utils/googleAuth'

export async function GET() {
  try {
    console.log('Iniciando GET delayed-jobs')
    
    const auth = await getAuthClient()
    const sheets = google.sheets({ version: 'v4', auth })
    
    const today = new Date()
    console.log('=== INFORMACIÓN DE TIEMPO ===')
    console.log('Fecha y hora del servidor:', today.toISOString())
    console.log('Timezone offset en minutos:', today.getTimezoneOffset())
    console.log('Fecha local:', today.toLocaleString())
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetIds.status,
      range: 'A:F',
      valueRenderOption: 'FORMATTED_VALUE'
    })

    const rows = response.data.values || []
    
    
    // Crear mapa para almacenar historial de estados por trabajo
    const historialTrabajos = new Map()
    
    // Procesar todas las filas para crear historial
    rows.forEach(row => {
      if (!row[0]) return // Ignorar filas sin número de trabajo
      
      const numeroTrabajo = row[0]
      if (!historialTrabajos.has(numeroTrabajo)) {
        historialTrabajos.set(numeroTrabajo, [])
      }
      
      historialTrabajos.get(numeroTrabajo).push({
        fecha: row[1],
        area: row[2],
        estado: row[3],
        usuario: row[4],
        fechaEntrega: row[5]
      })
    })
    
    // 1. Obtener trabajos en despacho
    const trabajosDespacho = rows.filter(row => row[3] === 'En despacho' || row[3] === 'Despacho - En despacho')
    console.log('\n=== TRABAJOS EN DESPACHO ===')
    console.log('Cantidad:', trabajosDespacho.length)
    trabajosDespacho.forEach(row => {
      console.log(`Trabajo: ${row[0]}, Fecha: ${row[1]}, Area: ${row[2]}, Usuario: ${row[4]}`)
    })

    const trabajosEnDespacho = new Set(trabajosDespacho.map(row => row[0]))
    
    // 2. Obtener trabajos en digitación
    const trabajosDigitacion = rows.filter(row => row[3] === 'Digitacion')
    trabajosDigitacion.forEach(row => {
      console.log(`Trabajo: ${row[0]}, Fecha Entrega: ${row[5]}, Area: ${row[2]}, Usuario: ${row[4]}`)
    })

    // 3. Filtrar trabajos pendientes
    const trabajosPendientes = trabajosDigitacion.filter(row => !trabajosEnDespacho.has(row[0]))

    // 4. Calcular atrasos con nuevo método
    const trabajosAtrasados = trabajosPendientes
      .map(row => {
        const fechaEntrega = row[5]
        if (!fechaEntrega) return null

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        let parsedDueDate = new Date(fechaEntrega)
        if (isNaN(parsedDueDate.getTime()) && fechaEntrega.includes('/')) {
          const [day, month, year] = fechaEntrega.split('/')
          const fullYear = year.length === 2 ? `20${year}` : year
          parsedDueDate = new Date(fullYear, month - 1, day)
        }
        parsedDueDate.setHours(0, 0, 0, 0)

        if (isNaN(parsedDueDate.getTime())) {
          console.log(`Fecha inválida para trabajo ${row[0]}: ${fechaEntrega}`)
          return null
        }

        const minDate = new Date()
        minDate.setFullYear(minDate.getFullYear() - 2)
        if (parsedDueDate < minDate || parsedDueDate > today) {
          console.log(`Fecha fuera de rango para trabajo ${row[0]}: ${fechaEntrega}`)
          return null
        }

        const diasHabilesAtraso = calcularDiasHabilesAtraso(parsedDueDate, today)
        const historial = historialTrabajos.get(row[0]) || []
        
        // Ordenar historial por fecha
        historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

        return {
          id: row[0],
          number: row[0],
          entryDate: row[1],
          area: row[2] || 'Sin área',
          status: row[3],
          user: row[4] || 'No asignado',
          dueDate: fechaEntrega,
          delayDays: diasHabilesAtraso,
          historial: historial,
          fechaEntregaOriginal: parsedDueDate.toLocaleDateString()
        }
      })
      .filter(trabajo => trabajo && trabajo.delayDays > 0)

    trabajosAtrasados.forEach(trabajo => {
      trabajo.historial.forEach(estado => {
        console.log(`- ${estado.fecha}: ${estado.estado} (${estado.area}) - ${estado.usuario}`)
      })
      console.log('---')
    })

    // Ordenar por días de atraso
    trabajosAtrasados.sort((a, b) => b.delayDays - a.delayDays)
    
    return Response.json(trabajosAtrasados)

  } catch (error) {
    console.error('Error en delayed-jobs:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

function calcularDiasHabilesAtraso(fechaEntrega, fechaActual) {
  let diasHabiles = 0
  const currentDate = new Date(fechaEntrega)
  
  // Si la fecha de entrega es posterior a la fecha actual, no hay atraso
  if (currentDate > fechaActual) {
    return 0
  }

  // Convertir ambas fechas a inicio del día para comparación correcta
  currentDate.setHours(0, 0, 0, 0)
  const endDate = new Date(fechaActual)
  endDate.setHours(0, 0, 0, 0)
  
  // Avanzar al siguiente día después de la fecha de entrega
  currentDate.setDate(currentDate.getDate() + 1)
  
  while (currentDate <= endDate) {
    const dia = currentDate.getDay()
    if (dia !== 0 && dia !== 6) { // 0 = Domingo, 6 = Sábado
      diasHabiles++
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Verificación adicional para evitar números imposibles
  const maxDiasPermitidos = 365 * 2 // máximo 2 años de atraso
  return Math.min(diasHabiles, maxDiasPermitidos)
}