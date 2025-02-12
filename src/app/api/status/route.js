import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { sheetIds } from '@/config/roles';
import { getAuthClient } from '@/utils/googleAuth';

const SEARCH_TYPES = {
  NV: {
    column: 'A',
    exact: true
  },
  RUT: {
    column: 'G',
    exact: false
  },
  NOMBRE: {
    column: 'I',
    exact: false
  },
  OT: {
    column: 'H',
    exact: false
  },
  OBSERVACION: {
    column: 'L',
    exact: false
  }
};

const DISPATCH_STATES = [
  "En despacho",
  "Fuera de Despacho",
  "Despacho - En despacho",
  "Despacho - Despachado",
  "Despachado"
];

const searchInText = (cellValue, searchValue, exact = false) => {
  if (!cellValue || !searchValue) return false;
  
  const normalizedCell = cellValue.toString().toLowerCase().trim();
  const normalizedSearch = searchValue.toString().toLowerCase().trim();
  
  if (exact) {
    return normalizedCell === normalizedSearch;
  }
  
  return normalizedCell.includes(normalizedSearch);
};

const formatDateForClient = (dateString) => {
  if (!dateString) return null;
  try {
    // Intentar diferentes formatos de fecha
    const formats = [
      // Formato ISO con zona horaria (2025-01-20T11:15:00Z)
      (str) => {
        if (str.includes('T') && str.endsWith('Z')) {
          const date = new Date(str);
          return !isNaN(date.getTime()) ? date : null;
        }
        return null;
      },
      // Formato ISO simple
      (str) => new Date(str),
      // Formato dd/mm/yyyy
      (str) => {
        const [day, month, year] = str.split('/');
        return new Date(year, month - 1, day);
      },
      // Formato dd-mm-yyyy
      (str) => {
        const [day, month, year] = str.split('-');
        return new Date(year, month - 1, day);
      }
    ];

    for (const format of formats) {
      try {
        const date = format(dateString);
        if (date && !isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch (e) {
        continue;
      }
    }
    
    console.warn('No se pudo parsear la fecha:', dateString);
    return null;
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return null;
  }
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const searchValue = searchParams.get('searchValue');
  const searchType = (searchParams.get('searchType') || 'nv').toUpperCase();

  console.log('Status API - Buscando:', { searchValue, searchType });

  if (!searchValue) {
    return NextResponse.json({ error: 'Valor de búsqueda no especificado' }, { status: 400 });
  }

  if (!SEARCH_TYPES[searchType]) {
    return NextResponse.json({ error: 'Tipo de búsqueda no válido' }, { status: 400 });
  }

  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Obtener datos de las tres hojas en paralelo
    const [statusResponse, historyResponse, nvHistoryResponse] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: sheetIds.status,
        range: 'A:L',
        valueRenderOption: 'FORMATTED_VALUE'
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: sheetIds.statusHistory,
        range: 'A:L',
        valueRenderOption: 'FORMATTED_VALUE'
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: sheetIds.statusNVHistory,
        range: 'A:L',
        valueRenderOption: 'FORMATTED_VALUE'
      })
    ]);

    // Extraer filas de cada respuesta
    const statusRows = statusResponse.data.values || [];
    const historyRows = historyResponse.data.values || [];
    const nvHistoryRows = nvHistoryResponse.data.values || [];

    // Combinar todas las filas (excluyendo headers)
    const allRows = [
      ...statusRows.slice(1),
      ...historyRows.slice(1),
      ...nvHistoryRows.slice(1)
    ];

    // Obtener configuración de búsqueda
    const { column, exact } = SEARCH_TYPES[searchType];
    const columnIndex = column.charCodeAt(0) - 'A'.charCodeAt(0);

    // Paso 1: Encontrar todos los números de NV que coinciden con la búsqueda
    let matchingNVs;
    if (searchType === 'NV') {
      // Para búsqueda por NV, usar directamente el valor de búsqueda
      matchingNVs = new Set([searchValue]);
    } else {
      // Para otros tipos de búsqueda, encontrar todos los NVs que coinciden
      matchingNVs = new Set(
        allRows
          .filter(row => {
            if (!row || !row[columnIndex]) return false;
            return searchInText(row[columnIndex], searchValue, exact);
          })
          .map(row => row[0]) // Obtener el NV (columna A)
      );
    }

    // Paso 2: Obtener todos los estados para los NVs encontrados
    const jobsMap = new Map();
    
    allRows.forEach(row => {
      const nv = row[0]; // Columna A - Número de trabajo
      if (matchingNVs.has(nv)) {
        if (!jobsMap.has(nv)) {
          jobsMap.set(nv, {
            number: nv,
            entryDate: null,
            dueDate: null,
            delayDays: 0,
            isDispatched: false,
            isCancelled: false,
            invoiceNumber: null,
            ot: null,
            historial: []
          });
        }
        
        const job = jobsMap.get(nv);
        const fecha = formatDateForClient(row[1]);
        const estado = row[3];

        // Verificar si es un trabajo anulado
        if (estado === "Bodega - Anulada") {
          job.isCancelled = true;
          job.delayDays = null;
        }

        // Verificar si es un estado de despacho
        if (DISPATCH_STATES.includes(estado)) {
          job.isDispatched = true;
          // Guardar número de factura solo si el estado es específicamente "Despachado"
          if (estado === "Despachado" && row[5]) {
            job.invoiceNumber = row[5];
          }
        }
        
        // Guardar OT si existe
        if (row[7]) { // Columna H
          job.ot = row[7];
        }
        
        // Actualizar fecha de entrada (la más antigua)
        if (!job.entryDate || (fecha && new Date(fecha) < new Date(job.entryDate))) {
          job.entryDate = fecha;
        }
        
        // Actualizar fecha de entrega si existe en la fila (columna F)
        const dueDate = formatDateForClient(row[5]);
        if (dueDate && (!job.dueDate || new Date(dueDate) > new Date(job.dueDate))) {
          job.dueDate = dueDate;
        }
        
        job.historial.push({
          fecha: fecha,
          estado: estado,
          usuario: row[4]
        });
      }
    });

    // Convertir el Map a array y calcular días de atraso
    let jobs = Array.from(jobsMap.values()).map(job => {
      // Calcular días de atraso solo si no está despachado
      if (job.dueDate && !job.isDispatched) {
        const today = new Date();
        const dueDate = new Date(job.dueDate);
        const diffTime = Math.abs(today - dueDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        job.delayDays = today > dueDate ? diffDays : -diffDays;
      } else {
        job.delayDays = null;
      }
      return job;
    });
    
    // Ordenar el historial de cada trabajo por fecha (más reciente primero)
    jobs.forEach(job => {
      job.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    });

    // Ordenar los trabajos: primero los no despachados, luego los despachados, y al final los anulados
    // Dentro de cada grupo, ordenar por fecha de entrega
    jobs.sort((a, b) => {
      // Si uno está anulado, va al final
      if (a.isCancelled !== b.isCancelled) {
        return a.isCancelled ? 1 : -1;
      }

      // Si ninguno está anulado, aplicar la lógica anterior
      if (!a.isCancelled && !b.isCancelled) {
        // Si uno está despachado y el otro no, el no despachado va primero
        if (a.isDispatched !== b.isDispatched) {
          return a.isDispatched ? 1 : -1;
        }
      }

      // Si están en el mismo grupo, ordenar por fecha de entrega
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

    return NextResponse.json(jobs);

  } catch (error) {
    console.error('Status API - Error detallado:', {
      message: error.message,
      stack: error.stack,
      details: error.response?.data
    });
    
    return NextResponse.json(
      { 
        error: 'Error al acceder a los datos',
        details: error.message
      }, 
      { status: 500 }
    );
  }
} 