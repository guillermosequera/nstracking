import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { sheetIds } from '@/config/roles';
import { getAuthClient } from '@/utils/googleAuth';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const jobNumber = searchParams.get('jobNumber');

  console.log('Status API - Buscando trabajo:', jobNumber);

  if (!jobNumber) {
    return NextResponse.json({ error: 'Número de trabajo no especificado' }, { status: 400 });
  }

  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Obtener datos de las tres hojas en paralelo
    const [statusResponse, historyResponse, nvHistoryResponse] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: sheetIds.status,
        range: 'A:E',
        valueRenderOption: 'FORMATTED_VALUE'
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: sheetIds.statusHistory,
        range: 'A:E',
        valueRenderOption: 'FORMATTED_VALUE'
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: sheetIds.statusNVHistory,
        range: 'A:E',
        valueRenderOption: 'FORMATTED_VALUE'
      })
    ]);

    // Extraer filas de cada respuesta
    const statusRows = statusResponse.data.values || [];
    const historyRows = historyResponse.data.values || [];
    const nvHistoryRows = nvHistoryResponse.data.values || [];

    // Combinar todas las filas y filtrar por el número de trabajo
    const allRows = [
      ...statusRows.slice(1), // Excluir headers
      ...historyRows.slice(1),
      ...nvHistoryRows.slice(1)
    ].filter(row => row[0] === jobNumber);

    // Ordenar por fecha (columna 1)
    const sortedRows = allRows.sort((a, b) => new Date(a[1]) - new Date(b[1]));

    return NextResponse.json(sortedRows);

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