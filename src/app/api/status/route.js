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
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetIds.status,
      range: 'A:E',
      valueRenderOption: 'FORMATTED_VALUE'
    });

    const rows = response.data.values || [];
    const filteredRows = rows.filter(row => row[0] === jobNumber);
    const sortedRows = filteredRows.sort((a, b) => new Date(a[1]) - new Date(b[1]));

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