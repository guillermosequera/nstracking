import { google } from 'googleapis'
import { sheetIds } from '@/config/roles'
import { getAuthClient } from '@/utils/googleAuth'
import { 
  procesarFecha, 
  calcularDiasHabilesAtraso, 
  procesarHistorialTrabajos,
  filtrarTrabajosPorEstado 
} from '../job-processing/route'

export async function GET() {
  try {
    console.log('\n=== INICIO ANÁLISIS DELAYED JOBS ===')
    
    const auth = await getAuthClient()
    const sheets = google.sheets({ version: 'v4', auth })
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetIds.status,
      range: 'A:F',
      valueRenderOption: 'FORMATTED_VALUE'
    })

    const rows = response.data.values || []
    console.log(`Total de registros en la hoja: ${rows.length}`)
    
    // 1. Procesamos el historial
    const historialTrabajos = procesarHistorialTrabajos(rows)
    console.log(`\nTotal de trabajos únicos encontrados: ${historialTrabajos.size}`)

    // Análisis detallado de estados
    let conteoEstados = {
      conDigitacion: 0,
      conDespacho: 0,
      enProceso: 0
    }

    historialTrabajos.forEach((historial, numeroTrabajo) => {
      const tuvoDigitacion = historial.some(registro => registro.estado === 'Digitacion')
      const tuvoDespacho = historial.some(registro => 
        registro.estado === 'En despacho' || 
        registro.estado === 'Despacho - En despacho' ||
        registro.estado === 'Despachado'
      )
      const estadoActual = historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0]
      const estaEnProceso = !['En despacho', 'Despacho - En despacho', 'Despachado'].includes(estadoActual.estado)

      if (tuvoDigitacion) conteoEstados.conDigitacion++
      if (tuvoDespacho) conteoEstados.conDespacho++
      if (estaEnProceso) conteoEstados.enProceso++

      if (tuvoDigitacion && tuvoDespacho) {
        console.log(`\nTrabajo ${numeroTrabajo}:`)
        console.log(`- Estado actual: ${estadoActual.estado}`)
        console.log(`- Historial de estados: ${historial.map(h => h.estado).join(' → ')}`)
      }
    })

    console.log('\n=== ANÁLISIS DE ESTADOS ===')
    console.log(`Trabajos que tuvieron Digitación: ${conteoEstados.conDigitacion}`)
    console.log(`Trabajos que tuvieron Despacho: ${conteoEstados.conDespacho}`)
    console.log(`Trabajos en proceso: ${conteoEstados.enProceso}`)

    // 2. Filtramos los trabajos pendientes
    const trabajosPendientes = filtrarTrabajosPorEstado(historialTrabajos)
      .map(([numeroTrabajo, historial]) => {
        const registrosDigitacion = historial
          .filter(registro => registro.estado === 'Digitacion')
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        
        const ultimaDigitacion = registrosDigitacion[0]
        
        const fechaIngreso = procesarFecha(ultimaDigitacion.fecha, numeroTrabajo)
        const fechaEntrega = procesarFecha(ultimaDigitacion.fechaEntrega, numeroTrabajo)
        
        return {
          id: numeroTrabajo,
          number: numeroTrabajo,
          entryDate: fechaIngreso ? fechaIngreso.fechaParaMostrar : null,
          area: ultimaDigitacion.area || 'Sin área',
          status: ultimaDigitacion.estado,
          user: ultimaDigitacion.usuario || 'No asignado',
          dueDate: fechaEntrega ? fechaEntrega.fechaParaMostrar : null,
          fechaEntregaOriginal: ultimaDigitacion.fechaEntrega,
          historial: historial.map(registro => ({
            ...registro,
            fecha: procesarFecha(registro.fecha, numeroTrabajo)?.fechaParaMostrar || registro.fecha
          }))
        }
      })

    console.log('\n=== RESUMEN DE TRABAJOS ===')
    console.log('Total trabajos pendientes:', trabajosPendientes.length)

    // 3. Calculamos los atrasos
    const trabajosAtrasados = trabajosPendientes
      .map(trabajo => {
        const fechaProcesada = procesarFecha(trabajo.fechaEntregaOriginal, trabajo.number)
        if (!fechaProcesada) return null

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const diasHabilesAtraso = calcularDiasHabilesAtraso(
          fechaProcesada.fechaParaProcesar, 
          today
        )

        return diasHabilesAtraso > 0 ? {
          ...trabajo,
          delayDays: diasHabilesAtraso
        } : null
      })
      .filter(Boolean)

    console.log('\n=== RESUMEN FINAL ===')
    console.log('Total trabajos atrasados:', trabajosAtrasados.length)

    // Ordenar por días de atraso
    trabajosAtrasados.sort((a, b) => b.delayDays - a.delayDays)
    
    const responseData = {
      data: trabajosAtrasados,
      metadata: {
        totalRegistros: rows.length,
        trabajosAtrasados: trabajosAtrasados.length,
        timestamp: new Date().toISOString(),
        estadisticas: {
          promedioAtraso: trabajosAtrasados.reduce((acc, job) => acc + job.delayDays, 0) / trabajosAtrasados.length,
          maxAtraso: Math.max(...trabajosAtrasados.map(job => job.delayDays)),
          minAtraso: Math.min(...trabajosAtrasados.map(job => job.delayDays))
        }
      }
    };

    console.log('\n=== RESPUESTA FINAL ===', {
      totalTrabajos: trabajosAtrasados.length,
      timestamp: responseData.metadata.timestamp,
      estadisticas: responseData.metadata.estadisticas
    });
    
    return Response.json(responseData, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Last-Modified': new Date().toUTCString(),
        'ETag': Math.random().toString(36).substring(7)
      }
    });

  } catch (error) {
    console.error('Error en delayed-jobs:', error)
    return Response.json(
      { 
        error: error.message,
        timestamp: new Date().toISOString()
      }, 
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  }
}