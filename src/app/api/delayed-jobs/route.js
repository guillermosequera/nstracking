import { google } from 'googleapis'
import { sheetIds } from '@/config/roles'
import { getAuthClient } from '@/utils/googleAuth'

function procesarFecha(fechaOriginal, numeroTrabajo) {
  if (!fechaOriginal) {
    console.log(`Trabajo ${numeroTrabajo}: Fecha vacía o nula`)
    return null
  }

  // Asegurarnos de que la fecha se interprete como UTC
  const fechaParsed = new Date(fechaOriginal)
  const fechaUTC = new Date(Date.UTC(
    fechaParsed.getUTCFullYear(),
    fechaParsed.getUTCMonth(),
    fechaParsed.getUTCDate(),
    fechaParsed.getUTCHours(),
    fechaParsed.getUTCMinutes(),
    fechaParsed.getUTCSeconds()
  ))
  
  if (!isNaN(fechaUTC.getTime())) {
    console.log(`\n=== Procesando fecha para trabajo ${numeroTrabajo} ===`)
    console.log('  Fecha original:', fechaOriginal)
    console.log('  Fecha UTC:', fechaUTC.toISOString())
    
    // Validación de rango
    const fechaHoy = new Date()
    const fechaHoyUTC = new Date(Date.UTC(
      fechaHoy.getUTCFullYear(),
      fechaHoy.getUTCMonth(),
      fechaHoy.getUTCDate()
    ))
    const fechaMinima = new Date(fechaHoyUTC)
    fechaMinima.setFullYear(fechaHoyUTC.getUTCFullYear() - 2)
    
    if (fechaUTC < fechaMinima || fechaUTC > fechaHoyUTC) {
      console.log(`  Fecha fuera de rango permitido (${fechaMinima.toISOString()} - ${fechaHoyUTC.toISOString()})`)
      return null
    }
    
    return {
      fechaParaProcesar: fechaUTC,
      fechaParaMostrar: fechaUTC.toISOString(),
      fechaFormateada: `${String(fechaUTC.getUTCDate()).padStart(2, '0')}-${String(fechaUTC.getUTCMonth() + 1).padStart(2, '0')}-${fechaUTC.getUTCFullYear()}`
    }
  }
  
  console.log(`Trabajo ${numeroTrabajo}: Fecha inválida:`, fechaOriginal)
  return null
}

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
    console.log(`Total de registros obtenidos: ${rows.length}`)
    
    // 1. Procesamos el historial
    const historialTrabajos = new Map()
    rows.forEach(row => {
      if (!row[0]) return
      
      if (!historialTrabajos.has(row[0])) {
        historialTrabajos.set(row[0], [])
      }
      
      historialTrabajos.get(row[0]).push({
        fecha: row[1],
        area: row[2],
        estado: row[3],
        usuario: row[4],
        fechaEntrega: row[5]
      })
    })
    
    console.log(`Total de trabajos únicos: ${historialTrabajos.size}`)

    // 2. Filtramos los trabajos pendientes
    const trabajosPendientes = Array.from(historialTrabajos.entries())
      .filter(([numeroTrabajo, historial]) => {
        const tuvoDigitacion = historial.some(registro => 
          registro.estado === 'Digitacion'
        );

        const tuvoDespacho = historial.some(registro => 
          registro.estado === 'En despacho' || 
          registro.estado === 'Despacho - En despacho'
        );

        // Obtener el estado actual (último registro)
        const estadoActual = historial
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];

        const estaEnProceso = !['En despacho', 'Despacho - En despacho'].includes(estadoActual.estado);

        // Log para debug
        if (tuvoDigitacion && !tuvoDespacho && estaEnProceso) {
          console.log(`Trabajo ${numeroTrabajo}: Estado actual = ${estadoActual.estado}`);
        }

        return tuvoDigitacion && !tuvoDespacho && estaEnProceso;
      })
      .map(([numeroTrabajo, historial]) => {
        // Obtener el registro de digitación más reciente
        const registrosDigitacion = historial
          .filter(registro => registro.estado === 'Digitacion')
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        const ultimaDigitacion = registrosDigitacion[0];
        
        return {
          id: numeroTrabajo,
          number: numeroTrabajo,
          entryDate: ultimaDigitacion.fecha,
          area: ultimaDigitacion.area || 'Sin área',
          status: ultimaDigitacion.estado,
          user: ultimaDigitacion.usuario || 'No asignado',
          dueDate: ultimaDigitacion.fechaEntrega,
          historial: historial
        };
      });

    console.log('\n=== RESUMEN DE TRABAJOS ===')
    console.log('Total trabajos pendientes:', trabajosPendientes.length)

    // 3. Calculamos los atrasos
    const trabajosAtrasados = trabajosPendientes
      .map(trabajo => {
        const fechaProcesada = procesarFecha(trabajo.dueDate, trabajo.number)
        if (!fechaProcesada) return null

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const diasHabilesAtraso = calcularDiasHabilesAtraso(
          fechaProcesada.fechaParaProcesar, 
          today
        )

        return diasHabilesAtraso > 0 ? {
          ...trabajo,
          delayDays: diasHabilesAtraso,
          fechaEntregaOriginal: fechaProcesada.fechaFormateada
        } : null
      })
      .filter(Boolean)

    console.log('\n=== RESUMEN FINAL ===')
    console.log('Total trabajos atrasados:', trabajosAtrasados.length)

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
  
  // Asegurarnos de que ambas fechas estén en UTC y al inicio del día
  const fechaEntregaUTC = new Date(Date.UTC(
    fechaEntrega.getUTCFullYear(),
    fechaEntrega.getUTCMonth(),
    fechaEntrega.getUTCDate()
  ))
  
  const fechaActualUTC = new Date(Date.UTC(
    fechaActual.getUTCFullYear(),
    fechaActual.getUTCMonth(),
    fechaActual.getUTCDate()
  ))
  
  // Si la fecha de entrega es posterior a la fecha actual, no hay atraso
  if (fechaEntregaUTC > fechaActualUTC) {
    return 0
  }

  const currentDate = new Date(fechaEntregaUTC)
  const endDate = new Date(fechaActualUTC)
  
  // Avanzar al siguiente día después de la fecha de entrega
  currentDate.setUTCDate(currentDate.getUTCDate() + 1)
  
  while (currentDate <= endDate) {
    const dia = currentDate.getUTCDay()
    if (dia !== 0 && dia !== 6) { // 0 = Domingo, 6 = Sábado
      diasHabiles++
    }
    currentDate.setUTCDate(currentDate.getUTCDate() + 1)
  }

  // Verificación adicional para evitar números imposibles
  const maxDiasPermitidos = 365 * 2 // máximo 2 años de atraso
  return Math.min(diasHabiles, maxDiasPermitidos)
}