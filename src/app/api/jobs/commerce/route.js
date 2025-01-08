import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getGoogleSheets } from '@/lib/googleSheets';

export async function GET() {
  try {
    const sheets = await getGoogleSheets();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Obtener datos de la hoja de comercio
    const commerceRange = 'Comercial!A2:E';
    const { data: { values: commerceData } } = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: commerceRange,
    });

    if (!commerceData) {
      return NextResponse.json({ error: 'No se encontraron datos' }, { status: 404 });
    }

    // Filtrar y formatear los datos
    const formattedData = commerceData
      .filter(row => row.length >= 4) // Asegurarse de que la fila tiene todos los datos necesarios
      .map(row => ({
        number: row[0],          // Número de trabajo
        entryDate: row[1],       // Fecha de ingreso
        deliveryDate: row[2],    // Fecha de entrega
        user: row[3],            // Usuario
        status: row[4] || ''     // Estado (si existe)
      }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error al obtener datos de comercio:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos de comercio' },
      { status: 500 }
    );
  }
} 