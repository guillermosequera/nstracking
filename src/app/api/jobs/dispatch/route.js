import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getGoogleSheets } from '@/lib/googleSheets';

export async function GET() {
  try {
    const sheets = await getGoogleSheets();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Obtener datos de la hoja de despacho
    const dispatchRange = 'Despacho!A2:E';
    const { data: { values: dispatchData } } = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: dispatchRange,
    });

    if (!dispatchData) {
      return NextResponse.json({ error: 'No se encontraron datos' }, { status: 404 });
    }

    // Filtrar y formatear los datos
    const formattedData = dispatchData
      .filter(row => row.length >= 3) // Asegurarse de que la fila tiene todos los datos necesarios
      .map(row => ({
        number: row[0],          // Número de trabajo
        dispatchDate: row[1],    // Fecha de despacho
        status: row[2] || '',    // Estado
        user: row[3] || '',      // Usuario (si existe)
        notes: row[4] || ''      // Notas (si existen)
      }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error al obtener datos de despacho:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos de despacho' },
      { status: 500 }
    );
  }
} 