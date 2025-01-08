// /app/api/job-processing/route.js
import { google } from 'googleapis'
import { sheetIds } from '@/config/roles'
import { getAuthClient } from '@/utils/googleAuth'

// Función para obtener la fecha de entrega del estado Digitacion
export function obtenerFechaEntregaDigitacion(historial) {
  if (!Array.isArray(historial)) return null;
  
  const registrosDigitacion = historial
    .filter(registro => registro.estado === 'Digitacion')
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
  if (registrosDigitacion.length === 0) return null;
  
  return registrosDigitacion[0].fechaEntrega;
}

// Función para procesar fechas
export function procesarFecha(fechaOriginal, numeroTrabajo) {
  if (!fechaOriginal) {
    console.log(`Trabajo ${numeroTrabajo}: Fecha vacía o nula`)
    return null
  }

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
    
    const fechaHoy = new Date()
    const fechaHoyUTC = new Date(Date.UTC(
      fechaHoy.getUTCFullYear(),
      fechaHoy.getUTCMonth(),
      fechaHoy.getUTCDate()
    ))
    
    const fechaMinima = new Date(Date.UTC(2000, 0, 1))
    
    if (fechaUTC < fechaMinima || fechaUTC > fechaHoyUTC) {
      console.log(`  Fecha fuera de rango permitido (${fechaMinima.toISOString()} - ${fechaHoyUTC.toISOString()})`)
      console.log('  Nota: Se permiten fechas desde el año 2000 hasta hoy')
    }
    
    const dia = String(fechaUTC.getUTCDate()).padStart(2, '0')
    const mes = String(fechaUTC.getUTCMonth() + 1).padStart(2, '0')
    const año = fechaUTC.getUTCFullYear()
    const hora = String(fechaUTC.getUTCHours()).padStart(2, '0')
    const minutos = String(fechaUTC.getUTCMinutes()).padStart(2, '0')
    
    return {
      fechaParaProcesar: fechaUTC,
      fechaParaMostrar: `${dia}/${mes}/${año} ${hora}:${minutos}`,
      fechaFormateada: `${dia}-${mes}-${año}`
    }
  }
  
  console.log(`Trabajo ${numeroTrabajo}: Fecha inválida:`, fechaOriginal)
  return null
}

// Función para calcular días hábiles entre fechas
export function calcularDiasHabilesEntreFechas(fechaInicio, fechaFin) {
  let diasHabiles = 0;
  
  const fechaInicioUTC = new Date(Date.UTC(
    fechaInicio.getUTCFullYear(),
    fechaInicio.getUTCMonth(),
    fechaInicio.getUTCDate()
  ));
  
  const fechaFinUTC = new Date(Date.UTC(
    fechaFin.getUTCFullYear(),
    fechaFin.getUTCMonth(),
    fechaFin.getUTCDate()
  ));
  
  const currentDate = new Date(fechaInicioUTC);
  
  while (currentDate <= fechaFinUTC) {
    const dia = currentDate.getUTCDay();
    if (dia !== 0 && dia !== 6) {
      diasHabiles++;
    }
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return diasHabiles;
}

// Función para procesar el historial de trabajos
export function procesarHistorialTrabajos(rows) {
  const historialTrabajos = new Map()
  
  rows.forEach(row => {
    const numeroTrabajo = row[0]
    if (!numeroTrabajo) {
      console.log('Se encontró una fila sin número de trabajo:', row)
      return
    }
    
    if (!historialTrabajos.has(numeroTrabajo)) {
      historialTrabajos.set(numeroTrabajo, [])
    }
    
    historialTrabajos.get(numeroTrabajo).push({
      numeroTrabajo,
      fecha: row[1],
      area: row[2],
      estado: row[3],
      usuario: row[4],
      fechaEntrega: row[5]
    })
  })

  console.log(`Total de trabajos procesados: ${historialTrabajos.size}`)
  return historialTrabajos
}

// Función para filtrar trabajos por estado
export function filtrarTrabajosPorEstado(historialTrabajos) {
  return Array.from(historialTrabajos.entries())
    .filter(([numeroTrabajo, historial]) => {
      if (!numeroTrabajo) {
        console.log('Se encontró un trabajo sin número durante el filtrado')
        return false
      }

      const tuvoDigitacion = historial.some(registro => 
        registro.estado === 'Digitacion'
      )

      const tuvoDespacho = historial.some(registro => 
        registro.estado === 'En despacho' || 
        registro.estado === 'Despacho - En despacho' ||
        registro.estado === 'Despachado' ||
        registro.estado === 'Bodega - Anulada'
      )

      const estadoActual = historial
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0]

      const estaEnProceso = !['En despacho', 'Despacho - En despacho', 'Despachado', 'Bodega - Anulada'].includes(estadoActual.estado)

      if (tuvoDigitacion && !tuvoDespacho && estaEnProceso) {
        console.log(`Trabajo ${numeroTrabajo}: Estado actual = ${estadoActual.estado}`)
      }

      return tuvoDigitacion && !tuvoDespacho && estaEnProceso
    })
    .map(([numeroTrabajo, historial]) => {
      // Aseguramos que cada registro tenga el número de trabajo
      return [
        numeroTrabajo,
        historial.map(registro => ({
          ...registro,
          numeroTrabajo // Aseguramos que cada registro tenga el número
        }))
      ]
    })
}

// Función para categorizar por fecha de entrega
export function categorizarFechaEntrega(fechaEntrega, numeroTrabajo) {
  if (!fechaEntrega) {
    console.log(`Trabajo ${numeroTrabajo}: Sin fecha de entrega para categorizar`)
    return null;
  }

  const fechaProcesada = procesarFecha(fechaEntrega, numeroTrabajo);
  if (!fechaProcesada) return null;

  const today = new Date();
  const todayUTC = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  ));

  const diasHabiles = calcularDiasHabilesEntreFechas(todayUTC, fechaProcesada.fechaParaProcesar);
  console.log(`Trabajo ${numeroTrabajo}: Días hábiles calculados = ${diasHabiles}`);

  if (diasHabiles > 10) return 'moreThan10Days';
  if (diasHabiles > 6) return 'moreThan6Days';
  if (diasHabiles > 2) return 'moreThan2Days';
  if (diasHabiles === 2) return 'twoDays';
  if (diasHabiles === 1) return 'oneDay';
  if (diasHabiles === 0) return 'today';
  if (diasHabiles === -1) return 'tomorrow';
  if (diasHabiles === -2) return 'dayAfterTomorrow';
  return '3DaysOrMore';
}

// Función para calcular días hábiles de atraso
export function calcularDiasHabilesAtraso(fechaEntrega, fechaActual) {
  if (!fechaEntrega || !fechaActual) return 0;

  const fechaEntregaUTC = new Date(Date.UTC(
    fechaEntrega.getUTCFullYear(),
    fechaEntrega.getUTCMonth(),
    fechaEntrega.getUTCDate()
  ));

  const fechaActualUTC = new Date(Date.UTC(
    fechaActual.getUTCFullYear(),
    fechaActual.getUTCMonth(),
    fechaActual.getUTCDate()
  ));

  // Si las fechas son iguales, retornar 0 (es para hoy)
  if (fechaEntregaUTC.getTime() === fechaActualUTC.getTime()) return 0;

  let diasHabiles = 0;
  let fechaInicio, fechaFin;
  let multiplicador = 1;

  // Si la fecha de entrega es futura, contar días negativos
  if (fechaEntregaUTC > fechaActualUTC) {
    fechaInicio = new Date(fechaActualUTC);
    fechaFin = new Date(fechaEntregaUTC);
    multiplicador = -1;
  } else {
    // Si la fecha de entrega ya pasó, comenzar desde el día siguiente
    fechaInicio = new Date(fechaEntregaUTC);
    fechaInicio.setUTCDate(fechaInicio.getUTCDate() + 1);
    fechaFin = new Date(fechaActualUTC);
  }

  const currentDate = new Date(fechaInicio);
  while (currentDate <= fechaFin) {
    const dia = currentDate.getUTCDay();
    // Solo contar días de lunes (1) a viernes (5)
    if (dia !== 0 && dia !== 6) {
      diasHabiles++;
    }
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return diasHabiles * multiplicador;
}

// Endpoint para obtener datos de la hoja
export async function GET() {
  try {
    const auth = await getAuthClient()
    const sheets = google.sheets({ version: 'v4', auth })
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetIds.status,
      range: 'A:F',
      valueRenderOption: 'FORMATTED_VALUE'
    })

    const rows = response.data.values || []
    
    return Response.json({
      success: true,
      data: rows
    })

  } catch (error) {
    console.error('Error en job-processing:', error)
    return Response.json(
      { error: 'Error al procesar los trabajos' },
      { status: 500 }
    )
  }
} 