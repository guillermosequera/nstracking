// /app/api/production/route.js
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getAuthClient } from '@/utils/googleAuth';
import { sheetIds } from '@/config/roles';
import { 
  procesarFecha, 
  procesarHistorialTrabajos,
  filtrarTrabajosPorEstado,
  categorizarFechaEntrega,
  obtenerFechaEntregaDigitacion,
  calcularDiasHabilesEntreFechas,
  calcularDiasHabilesAtraso
} from '../job-processing/route'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    console.log('\n=== 🔄 INICIO PETICIÓN PRODUCCIÓN ===');
    
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Obtener datos de las tres hojas
    const [statusResponse, historyResponse, nvHistoryResponse] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: sheetIds.status,
        range: 'A:F',
        valueRenderOption: 'FORMATTED_VALUE'
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: sheetIds.statusHistory,
        range: 'A:F',
        valueRenderOption: 'FORMATTED_VALUE'
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: sheetIds.statusNVHistory,
        range: 'A:F',
        valueRenderOption: 'FORMATTED_VALUE'
      })
    ]);

    // Extraer y combinar filas de las tres hojas
    const statusRows = statusResponse.data.values || [];
    const historyRows = historyResponse.data.values || [];
    const nvHistoryRows = nvHistoryResponse.data.values || [];

    // Combinar todas las filas (excluyendo headers si existen)
    const allRows = [
      ...statusRows.slice(1),
      ...historyRows.slice(1),
      ...nvHistoryRows.slice(1)
    ];

    if (allRows.length === 0) return NextResponse.json({});

    console.log('📊 Datos combinados de Google Sheets:', {
      totalFilas: allRows.length,
      filasPorHoja: {
        status: statusRows.length - 1,
        history: historyRows.length - 1,
        nvHistory: nvHistoryRows.length - 1
      },
      timestamp: new Date().toISOString()
    });

    // Procesamos el historial usando la función común
    const historialTrabajos = procesarHistorialTrabajos(allRows);
    console.log(`Total de trabajos únicos: ${historialTrabajos.size}`);

    // Filtramos los trabajos usando la función común
    const trabajosFiltrados = filtrarTrabajosPorEstado(historialTrabajos)
      .map(([numeroTrabajo, historial]) => {
        if (!numeroTrabajo) {
          console.log('Se encontró un trabajo sin número durante el mapeo final')
          return null
        }

        // Obtener el último estado
        const estadoActual = historial
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];

        // Obtener la fecha de entrega del estado Digitacion
        const fechaEntregaDigitacion = obtenerFechaEntregaDigitacion(historial);
        
        // Procesar fechas usando la función común
        const fechaIngreso = procesarFecha(estadoActual.fecha, numeroTrabajo);
        const fechaEntrega = procesarFecha(fechaEntregaDigitacion, numeroTrabajo);

        // Calcular días hábiles de atraso (usando la misma lógica que delayed-jobs)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diasHabilesAtraso = fechaEntrega ? 
          calcularDiasHabilesAtraso(fechaEntrega.fechaParaProcesar, today) : 
          null;

        return {
          id: numeroTrabajo,
          number: numeroTrabajo,
          entryDate: fechaIngreso?.fechaParaMostrar,
          deliveryDate: fechaEntrega?.fechaParaMostrar,
          fechaParaProcesar: fechaEntrega?.fechaParaProcesar,
          diasHabilesAtraso,
          user: estadoActual.usuario,
          status: estadoActual.estado,
          historial: historial.map(registro => ({
            ...registro,
            numeroTrabajo,
            fecha: procesarFecha(registro.fecha, numeroTrabajo)?.fechaParaMostrar
          }))
        };
      })
      .filter(trabajo => trabajo !== null);

    // Agrupar por estado y categoría
    const trabajosAgrupados = {};

    trabajosFiltrados.forEach(trabajo => {
      if (!trabajo.number) {
        console.log('Se encontró un trabajo sin número durante el agrupamiento:', trabajo)
        return
      }

      // Determinar categoría basada en días de atraso
      let categoria;
      const diasAtraso = trabajo.diasHabilesAtraso;

      if (diasAtraso === null) {
        console.log(`No se pudo determinar los días de atraso para el trabajo ${trabajo.number}`);
        return;
      }

      if (diasAtraso > 10) categoria = 'moreThan10Days';
      else if (diasAtraso > 6) categoria = 'moreThan6Days';
      else if (diasAtraso > 2) categoria = 'moreThan2Days';
      else if (diasAtraso === 2) categoria = 'twoDays';
      else if (diasAtraso === 1) categoria = 'oneDay';
      else if (diasAtraso === 0) categoria = 'today';
      else if (diasAtraso === -1) categoria = 'tomorrow';
      else if (diasAtraso === -2) categoria = 'dayAfterTomorrow';
      else categoria = '3DaysOrMore';

      const { status: estado } = trabajo;
      const area = trabajo.historial[0].area;

      if (!trabajosAgrupados[estado]) {
        trabajosAgrupados[estado] = {
          area,
          jobs: {}
        };
      }

      if (!trabajosAgrupados[estado].jobs[categoria]) {
        trabajosAgrupados[estado].jobs[categoria] = [];
      }

      trabajosAgrupados[estado].jobs[categoria].push(trabajo);
    });

    // Agregar timestamp a la respuesta
    const responseData = {
      timestamp: new Date().toISOString(),
      data: trabajosAgrupados,
      metadata: {
        totalRegistros: allRows.length,
        trabajosProcesados: trabajosFiltrados.length,
        actualizadoEn: new Date().toISOString()
      }
    };

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('❌ Error en API de producción:', error);
    return NextResponse.json(
      { 
        error: 'Error al procesar la solicitud', 
        details: error.message,
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
    );
  }
} 